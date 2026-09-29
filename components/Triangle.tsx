export type TriangleType = "up" | "down";

export default function Triangle({ type }: { type?: TriangleType }) {
    return (
        <span
            className={`h-0 w-0 border-r-4 border-l-4 border-r-transparent border-l-transparent ${!type || type === "up" ? "border-b-[6px] border-b-gray-500" : "border-t-[6px] border-t-gray-500"} `}
        />
    );
}
