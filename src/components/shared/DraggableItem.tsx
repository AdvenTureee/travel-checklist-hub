
import React from 'react';
import { Draggable } from 'react-beautiful-dnd';

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
          {...provided.dragHandleProps}
          className={`w-full transition-all duration-200 ${className} ${snapshot.isDragging ? 'opacity-70 shadow-lg z-10 bg-travel-beige' : ''}`}
        >
          {children}
        </div>
      )}
    </Draggable>
  );
};

export default DraggableItem;
