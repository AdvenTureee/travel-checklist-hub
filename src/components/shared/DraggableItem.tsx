
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
          className={`${className} ${snapshot.isDragging ? 'opacity-70 z-10' : ''}`}
        >
          {children}
        </div>
      )}
    </Draggable>
  );
};

export default DraggableItem;
