
import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { GripVertical } from 'lucide-react';

interface DraggableItemProps {
  id: string;
  index: number;
  children: React.ReactNode;
  className?: string;
}

const DraggableItem: React.FC<DraggableItemProps> = ({ id, index, children, className = '' }) => {
  return (
    <Draggable draggableId={id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`relative ${className} ${snapshot.isDragging ? 'shadow-lg z-10' : ''}`}
        >
          <div 
            {...provided.dragHandleProps}
            className="absolute left-0 top-1/2 -translate-y-1/2 px-1 flex items-center cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="h-5 w-5 text-travel-dark/50" />
          </div>
          <div className="pl-7">
            {children}
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default DraggableItem;
