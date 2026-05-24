import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

type IconNode = ReadonlyArray<
  Readonly<{
    type: "path" | "circle" | "line" | "polyline" | "rect";
    props: Record<string, string | number>;
  }>
>;

function makeIcon(node: IconNode, viewBox = "0 0 24 24") {
  return function Icon({ className, ...props }: IconProps) {
    return (
      <svg
        viewBox={viewBox}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
        {...props}
      >
        {node.map((item, i) => {
          const key = `${item.type}-${i}`;
          if (item.type === "path") return <path key={key} {...item.props} />;
          if (item.type === "circle") return <circle key={key} {...item.props} />;
          if (item.type === "line") return <line key={key} {...item.props} />;
          if (item.type === "polyline") return <polyline key={key} {...item.props} />;
          return <rect key={key} {...item.props} />;
        })}
      </svg>
    );
  };
}

export const ChevronRight = makeIcon([{ type: "polyline", props: { points: "9 18 15 12 9 6" } }]);
export const ChevronLeft = makeIcon([{ type: "polyline", props: { points: "15 18 9 12 15 6" } }]);
export const ChevronDown = makeIcon([{ type: "polyline", props: { points: "6 9 12 15 18 9" } }]);
export const ChevronUp = makeIcon([{ type: "polyline", props: { points: "18 15 12 9 6 15" } }]);
export const ChevronDownIcon = ChevronDown;
export const ChevronLeftIcon = ChevronLeft;
export const ChevronRightIcon = ChevronRight;

export const ArrowRight = makeIcon([{ type: "line", props: { x1: 5, y1: 12, x2: 19, y2: 12 } }, { type: "polyline", props: { points: "12 5 19 12 12 19" } }]);
export const ArrowLeft = makeIcon([{ type: "line", props: { x1: 19, y1: 12, x2: 5, y2: 12 } }, { type: "polyline", props: { points: "12 19 5 12 12 5" } }]);
export const ArrowUpDown = makeIcon([
  { type: "line", props: { x1: 12, y1: 4, x2: 12, y2: 20 } },
  { type: "polyline", props: { points: "8 8 12 4 16 8" } },
  { type: "polyline", props: { points: "16 16 12 20 8 16" } },
]);

export const Check = makeIcon([{ type: "polyline", props: { points: "20 6 9 17 4 12" } }]);
export const X = makeIcon([{ type: "line", props: { x1: 18, y1: 6, x2: 6, y2: 18 } }, { type: "line", props: { x1: 6, y1: 6, x2: 18, y2: 18 } }]);
export const Circle = makeIcon([{ type: "circle", props: { cx: 12, cy: 12, r: 9 } }]);
export const Minus = makeIcon([{ type: "line", props: { x1: 5, y1: 12, x2: 19, y2: 12 } }]);

export const Search = makeIcon([
  { type: "circle", props: { cx: 11, cy: 11, r: 7 } },
  { type: "line", props: { x1: 21, y1: 21, x2: 16.65, y2: 16.65 } },
]);
export const Mail = makeIcon([
  { type: "rect", props: { x: 3, y: 5, width: 18, height: 14, rx: 2, ry: 2 } },
  { type: "polyline", props: { points: "3 7 12 13 21 7" } },
]);
export const Eye = makeIcon([
  { type: "path", props: { d: "M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z" } },
  { type: "circle", props: { cx: 12, cy: 12, r: 3 } },
]);
export const EyeOff = makeIcon([
  { type: "path", props: { d: "M2 12s3.5-6 10-6c2.4 0 4.3.8 5.8 1.9" } },
  { type: "path", props: { d: "M22 12s-3.5 6-10 6c-2.4 0-4.3-.8-5.8-1.9" } },
  { type: "line", props: { x1: 3, y1: 3, x2: 21, y2: 21 } },
]);

export const Lock = makeIcon([
  { type: "rect", props: { x: 4, y: 11, width: 16, height: 10, rx: 2, ry: 2 } },
  { type: "path", props: { d: "M8 11V8a4 4 0 0 1 8 0v3" } },
]);
export const Shield = makeIcon([
  { type: "path", props: { d: "M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-3z" } },
]);
export const Bell = makeIcon([
  { type: "path", props: { d: "M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8" } },
  { type: "path", props: { d: "M10 20a2 2 0 0 0 4 0" } },
]);

export const Moon = makeIcon([{ type: "path", props: { d: "M21 12.8A9 9 0 1 1 11.2 3 7 7 0 1 0 21 12.8z" } }]);
export const Sun = makeIcon([
  { type: "circle", props: { cx: 12, cy: 12, r: 4 } },
  { type: "line", props: { x1: 12, y1: 2, x2: 12, y2: 5 } },
  { type: "line", props: { x1: 12, y1: 19, x2: 12, y2: 22 } },
  { type: "line", props: { x1: 2, y1: 12, x2: 5, y2: 12 } },
  { type: "line", props: { x1: 19, y1: 12, x2: 22, y2: 12 } },
]);

export const Plus = makeIcon([
  { type: "line", props: { x1: 12, y1: 5, x2: 12, y2: 19 } },
  { type: "line", props: { x1: 5, y1: 12, x2: 19, y2: 12 } },
]);
export const Menu = makeIcon([
  { type: "line", props: { x1: 4, y1: 7, x2: 20, y2: 7 } },
  { type: "line", props: { x1: 4, y1: 12, x2: 20, y2: 12 } },
  { type: "line", props: { x1: 4, y1: 17, x2: 20, y2: 17 } },
]);
export const LogOut = makeIcon([
  { type: "path", props: { d: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" } },
  { type: "line", props: { x1: 16, y1: 17, x2: 21, y2: 12 } },
  { type: "line", props: { x1: 21, y1: 12, x2: 16, y2: 7 } },
  { type: "line", props: { x1: 21, y1: 12, x2: 9, y2: 12 } },
]);

export const LayoutDashboard = makeIcon([
  { type: "rect", props: { x: 3, y: 3, width: 8, height: 8, rx: 1, ry: 1 } },
  { type: "rect", props: { x: 13, y: 3, width: 8, height: 5, rx: 1, ry: 1 } },
  { type: "rect", props: { x: 13, y: 10, width: 8, height: 11, rx: 1, ry: 1 } },
  { type: "rect", props: { x: 3, y: 13, width: 8, height: 8, rx: 1, ry: 1 } },
]);
export const Users = makeIcon([
  { type: "circle", props: { cx: 9, cy: 8, r: 3 } },
  { type: "circle", props: { cx: 17, cy: 10, r: 2.5 } },
  { type: "path", props: { d: "M3 19c0-3.3 2.7-6 6-6s6 2.7 6 6" } },
  { type: "path", props: { d: "M14 19c.3-2.1 1.8-3.8 3.8-4.4" } },
]);
export const FolderOpen = makeIcon([
  { type: "path", props: { d: "M3 7h6l2 2h10v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" } },
  { type: "path", props: { d: "M3 11h18" } },
]);
export const BarChart3 = makeIcon([
  { type: "line", props: { x1: 4, y1: 20, x2: 20, y2: 20 } },
  { type: "rect", props: { x: 6, y: 11, width: 3, height: 7, rx: 1, ry: 1 } },
  { type: "rect", props: { x: 11, y: 8, width: 3, height: 10, rx: 1, ry: 1 } },
  { type: "rect", props: { x: 16, y: 5, width: 3, height: 13, rx: 1, ry: 1 } },
]);
export const Fingerprint = makeIcon([{ type: "path", props: { d: "M12 3a7 7 0 0 0-7 7v3a7 7 0 0 0 14 0v-1" } }, { type: "path", props: { d: "M8 13v1a4 4 0 0 0 8 0v-2" } }, { type: "path", props: { d: "M10 10v5a2 2 0 0 0 4 0v-5" } }]);
export const ScrollText = makeIcon([
  { type: "rect", props: { x: 4, y: 3, width: 16, height: 18, rx: 2, ry: 2 } },
  { type: "line", props: { x1: 8, y1: 8, x2: 16, y2: 8 } },
  { type: "line", props: { x1: 8, y1: 12, x2: 16, y2: 12 } },
  { type: "line", props: { x1: 8, y1: 16, x2: 13, y2: 16 } },
]);
export const UserCog = makeIcon([
  { type: "circle", props: { cx: 9, cy: 8, r: 3 } },
  { type: "path", props: { d: "M3 20c0-3 2.5-5 6-5" } },
  { type: "circle", props: { cx: 17, cy: 15, r: 3 } },
]);
export const Settings = makeIcon([
  { type: "circle", props: { cx: 12, cy: 12, r: 3 } },
  { type: "path", props: { d: "M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.2a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.2a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 0 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3h0A1.6 1.6 0 0 0 10 3.2V3a2 2 0 0 1 4 0v.2a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8v0a1.6 1.6 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.2a1.6 1.6 0 0 0-1.4 1z" } },
]);

export const PanelLeft = makeIcon([
  { type: "rect", props: { x: 3, y: 4, width: 18, height: 16, rx: 2, ry: 2 } },
  { type: "line", props: { x1: 9, y1: 4, x2: 9, y2: 20 } },
]);
export const MoreHorizontal = makeIcon([
  { type: "circle", props: { cx: 6, cy: 12, r: 1.5 } },
  { type: "circle", props: { cx: 12, cy: 12, r: 1.5 } },
  { type: "circle", props: { cx: 18, cy: 12, r: 1.5 } },
]);
export const GripVertical = makeIcon([
  { type: "circle", props: { cx: 9, cy: 5, r: 1 } },
  { type: "circle", props: { cx: 9, cy: 12, r: 1 } },
  { type: "circle", props: { cx: 9, cy: 19, r: 1 } },
  { type: "circle", props: { cx: 15, cy: 5, r: 1 } },
  { type: "circle", props: { cx: 15, cy: 12, r: 1 } },
  { type: "circle", props: { cx: 15, cy: 19, r: 1 } },
]);

export const Pencil = makeIcon([
  { type: "path", props: { d: "M12 20h9" } },
  { type: "path", props: { d: "M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" } },
]);
export const Upload = makeIcon([
  { type: "path", props: { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" } },
  { type: "line", props: { x1: 12, y1: 3, x2: 12, y2: 15 } },
  { type: "polyline", props: { points: "7 8 12 3 17 8" } },
]);
export const FileText = makeIcon([
  { type: "path", props: { d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" } },
  { type: "polyline", props: { points: "14 2 14 8 20 8" } },
  { type: "line", props: { x1: 8, y1: 13, x2: 16, y2: 13 } },
  { type: "line", props: { x1: 8, y1: 17, x2: 16, y2: 17 } },
]);
export const UserX = makeIcon([
  { type: "circle", props: { cx: 9, cy: 7, r: 3 } },
  { type: "path", props: { d: "M3 20c0-3 2.5-5 6-5" } },
  { type: "line", props: { x1: 16, y1: 11, x2: 22, y2: 17 } },
  { type: "line", props: { x1: 22, y1: 11, x2: 16, y2: 17 } },
]);
export const Download = makeIcon([
  { type: "path", props: { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" } },
  { type: "line", props: { x1: 12, y1: 3, x2: 12, y2: 15 } },
  { type: "polyline", props: { points: "17 10 12 15 7 10" } },
]);

export const AlertTriangle = makeIcon([
  { type: "path", props: { d: "M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" } },
  { type: "line", props: { x1: 12, y1: 9, x2: 12, y2: 13 } },
  { type: "line", props: { x1: 12, y1: 17, x2: 12.01, y2: 17 } },
]);
export const CheckCircle2 = makeIcon([
  { type: "circle", props: { cx: 12, cy: 12, r: 9 } },
  { type: "polyline", props: { points: "9 12 11 14 15 10" } },
]);
