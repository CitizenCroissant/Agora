import type { ComponentPropsWithoutRef } from "react";
import styles from "./FilterBar.module.css";

export type FilterBarLayout = "stacked" | "row" | "wrap" | "inline";

const layoutClass: Record<FilterBarLayout, string> = {
  stacked: styles.layoutStacked,
  row: styles.layoutRow,
  wrap: styles.layoutWrap,
  inline: styles.layoutInline
};

type FilterBarProps = {
  children: React.ReactNode;
  className?: string;
  layout?: FilterBarLayout;
} & ComponentPropsWithoutRef<"section">;

export function FilterBar({
  children,
  className,
  layout = "wrap",
  ...rest
}: FilterBarProps) {
  return (
    <section
      className={`${styles.root} ${layoutClass[layout]} ${className ?? ""}`.trim()}
      {...rest}
    >
      {children}
    </section>
  );
}

/** Use inside `layout="wrap"` bars so a search input shares space with actions. */
export function FilterBarGrow({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`${styles.grow} ${className ?? ""}`.trim()}>{children}</div>
  );
}
