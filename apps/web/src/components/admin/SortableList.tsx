"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

function Row({
  id,
  disabled,
  children,
  className,
}: {
  id: string;
  disabled: boolean;
  children: (handle: ReactNode) => ReactNode;
  className?: string | undefined;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled });
  const handle = disabled ? null : (
    <button
      type="button"
      aria-label="Drag to reorder (Space to pick up, arrow keys to move)"
      className="grid size-8 shrink-0 cursor-grab touch-none place-items-center rounded-md text-muted hover:bg-line active:cursor-grabbing"
      {...attributes}
      {...listeners}
    >
      <GripVertical className="size-4" aria-hidden="true" />
    </button>
  );
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("relative list-none", isDragging && "z-10 opacity-80 shadow-xl", className)}
    >
      {children(handle)}
    </li>
  );
}

/** Vertical drag-and-drop list (pointer + keyboard). `onReorder` receives items in their new order. */
export function SortableList<T extends { id: string }>({
  items,
  onReorder,
  renderItem,
  disabled = false,
  className,
  label,
}: {
  items: T[];
  onReorder: (next: T[]) => void;
  renderItem: (item: T, handle: ReactNode) => ReactNode;
  disabled?: boolean;
  className?: string;
  label: string;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragEnd({ active, over }: DragEndEvent): void {
    if (!over || active.id === over.id) return;
    const from = items.findIndex((i) => i.id === active.id);
    const to = items.findIndex((i) => i.id === over.id);
    if (from >= 0 && to >= 0) onReorder(arrayMove(items, from, to));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy} disabled={disabled}>
        <ul aria-label={label} className={cn("space-y-2", className)}>
          {items.map((item) => (
            <Row key={item.id} id={item.id} disabled={disabled}>
              {(handle) => renderItem(item, handle)}
            </Row>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
