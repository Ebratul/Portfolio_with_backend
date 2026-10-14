"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import type { ReorderInput } from "@portfolio/shared";
import { toast } from "sonner";
import { AdminApiError, adminFetch } from "./client";

interface Identified {
  id: string;
}

export interface Resource<T extends Identified, I> {
  key: string;
  useList: () => UseQueryResult<T[]>;
  useCreate: () => UseMutationResult<T, Error, I>;
  useUpdate: () => UseMutationResult<T, Error, { id: string; patch: Partial<I>; silent?: boolean }>;
  useRemove: () => UseMutationResult<unknown, Error, string>;
  useReorder: () => UseMutationResult<unknown, Error, string[]>;
}

export const errorMessage = (err: unknown): string =>
  err instanceof AdminApiError || err instanceof Error ? err.message : "Something went wrong";

/**
 * CRUD hooks for an ordered admin collection. Update, delete and reorder are optimistic: the cache
 * changes immediately and rolls back (with a toast) if the server rejects the change.
 */
export function createResource<T extends Identified, I>(
  key: string,
  path: string,
  noun: string,
): Resource<T, I> {
  const snapshot = async (qc: QueryClient): Promise<T[] | undefined> => {
    await qc.cancelQueries({ queryKey: [key] });
    return qc.getQueryData<T[]>([key]);
  };

  return {
    key,
    useList: () => useQuery({ queryKey: [key], queryFn: () => adminFetch<T[]>(path) }),

    useCreate: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: (input: I) => adminFetch<T>(path, { method: "POST", body: input }),
        onSuccess: () => {
          toast.success(`${noun} created`);
          void qc.invalidateQueries({ queryKey: [key] });
          void qc.invalidateQueries({ queryKey: ["stats"] });
        },
        onError: (err) => toast.error(errorMessage(err)),
      });
    },

    useUpdate: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: ({ id, patch }: { id: string; patch: Partial<I>; silent?: boolean }) =>
          adminFetch<T>(`${path}/${id}`, { method: "PATCH", body: patch }),
        onMutate: async ({ id, patch }) => {
          const prev = await snapshot(qc);
          qc.setQueryData<T[]>([key], (old) => old?.map((x) => (x.id === id ? { ...x, ...patch } : x)));
          return { prev };
        },
        onSuccess: (_d, v) => {
          if (!v.silent) toast.success(`${noun} updated`);
        },
        onError: (err, _v, ctx) => {
          qc.setQueryData([key], (ctx as { prev?: T[] } | undefined)?.prev);
          toast.error(errorMessage(err));
        },
        onSettled: () => void qc.invalidateQueries({ queryKey: [key] }),
      });
    },

    useRemove: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: (id: string) => adminFetch(`${path}/${id}`, { method: "DELETE" }),
        onMutate: async (id) => {
          const prev = await snapshot(qc);
          qc.setQueryData<T[]>([key], (old) => old?.filter((x) => x.id !== id));
          return { prev };
        },
        onSuccess: () => {
          toast.success(`${noun} deleted`);
          void qc.invalidateQueries({ queryKey: ["stats"] });
        },
        onError: (err, _id, ctx) => {
          qc.setQueryData([key], (ctx as { prev?: T[] } | undefined)?.prev);
          toast.error(errorMessage(err));
        },
        onSettled: () => void qc.invalidateQueries({ queryKey: [key] }),
      });
    },

    /** `ids` is the new order of (a subset of) the collection; order values become their indexes. */
    useReorder: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: (ids: string[]) => {
          const body: ReorderInput = { items: ids.map((id, order) => ({ id, order })) };
          return adminFetch(`${path}/reorder`, { method: "PATCH", body });
        },
        onMutate: async (ids) => {
          const prev = await snapshot(qc);
          qc.setQueryData<T[]>([key], (old) => {
            if (!old) return old;
            const rank = new Map(ids.map((id, i) => [id, i]));
            const moved = old.filter((x) => rank.has(x.id)).sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0));
            let n = 0;
            return old.map((x) => (rank.has(x.id) ? (moved[n++] as T) : x));
          });
          return { prev };
        },
        onError: (err, _ids, ctx) => {
          qc.setQueryData([key], (ctx as { prev?: T[] } | undefined)?.prev);
          toast.error(errorMessage(err));
        },
        onSettled: () => void qc.invalidateQueries({ queryKey: [key] }),
      });
    },
  };
}
