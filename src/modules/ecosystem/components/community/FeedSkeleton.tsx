import { memo } from 'react';

const FeedSkeleton = memo(function FeedSkeleton() {
  return (
    <>
      <div className="mxl-comm__skeleton" />
      <div className="mxl-comm__skeleton" />
      <div className="mxl-comm__skeleton" />
    </>
  );
});

export default FeedSkeleton;
