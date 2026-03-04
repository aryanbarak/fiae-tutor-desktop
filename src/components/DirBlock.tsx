import React from "react";

type DirBlockProps = {
  rtl: boolean;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export default function DirBlock({
  rtl,
  children,
  className,
  style,
}: DirBlockProps) {
  const combinedClass = [className, rtl ? "rtl" : undefined]
    .filter(Boolean)
    .join(" ");
  return (
    <div
      dir={rtl ? "rtl" : "ltr"}
      className={combinedClass || undefined}
      style={{
        textAlign: rtl ? "right" : "left",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
