import type { SVGProps } from 'react';

export function ChaseHorseLogo({ size = 36, className, ...props }: { size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Dynamic Running Stallion Silhouette */}
      <path
        d="M6 32C8 28 12 25 15 25C17 25 18 26 20 25C22 24 24 20 26 17C27 15 29 11 32 9C34 7 38 6 41 8C43 9 44 11 43 13C42 14 39 15 37 15C36 15 35 14 34 14C32 14 30 16 29 18C28 20 29 22 28 24C27 26 24 28 22 29C20 30 17 31 15 33C13 35 11 38 8 40C7 41 6 39 6 37C6 35 6 33 6 32Z"
        fill="#FFFFFF"
      />
      <path
        d="M20 25C22 26 25 28 28 28C31 28 35 27 38 29C40 30 42 32 44 35C45 36 43 37 42 37C39 37 36 34 33 33C30 32 27 32 25 31L20 25Z"
        fill="#FFFFFF"
        opacity="0.9"
      />
      <path
        d="M28 24C30 23 34 22 36 24C38 26 40 29 42 32C41 33 39 33 37 31C35 29 33 27 30 26L28 24Z"
        fill="#F2551D"
      />
    </svg>
  );
}
