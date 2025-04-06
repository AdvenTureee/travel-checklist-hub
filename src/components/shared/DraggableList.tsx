
import React from 'react';
import { DragDropContext, Droppable, DropResult } from 'react-beautiful-dnd';

interface DraggableListProps {
  droppableId: string;
  onDragEnd: (result: DropResult) => void;
  children: React.ReactNode;
  className?: string;
}

const DraggableList: React.FC<DraggableListProps> = ({ 
  droppableId, 
  onDragEnd, 
  children,
  className = '' 
}) => {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId={droppableId}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`w-full transition-all ${className}`}
          >
            {children}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};

export default DraggableList;
