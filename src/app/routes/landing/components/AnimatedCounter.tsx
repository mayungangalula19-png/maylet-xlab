import { useEffect, useRef, useState } from 'react';

interface Props {
  target: number;
  prefix?: string;
  suffix?: string;
}

export function AnimatedCounter({ target, prefix = '', suffix = '' }: Props) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          let start = 0;
          const duration = 2000;
          const step = (timestamp: number) => {
            if (!start) start = timestamp;
            const progress = Math.min((timestamp - start) / duration, 1);
            setCount(Math.floor(progress * target));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, hasAnimated]);

  const display =
    suffix === 'M+' && target < 100
      ? `${prefix}${count}${suffix}`
      : `${prefix}${count.toLocaleString()}${suffix}`;

  return <div ref={ref}>{display}</div>;
}
