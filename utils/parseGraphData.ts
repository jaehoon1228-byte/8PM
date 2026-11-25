import type { ChartDataPoint } from "@/types/dashboard";

export interface ParsedGraphMessage {
    // <GraphData> 태그를 제거한 텍스트
    cleanText: string;
    // Recharts 시각화용 데이터
    chartData: ChartDataPoint[];
    // 차트 타입
    chartType?: string;
}

export function parseGraphDataFromText(rawText: string): ParsedGraphMessage {
    if (!rawText || !rawText.includes("<GraphData")) {
        return {
            cleanText: rawText,
            chartData: [],
        }
    }

    const graphTagRegex =
        /<GraphData(?:\s+type=["']([^"']*)["'])?\s*>([\s\S]*?)<\/GraphData>/i;
    const match = rawText.match(graphTagRegex);

    if (!match) {
        return {
            cleanText: rawText,
            chartData: [],
        };
    }

    const chartType = match[1]?.trim() || "bar";
    const innerContent = match[2]?.trim() ?? "";

    // 태그를 제거한 나머지 텍스트 정리
    const cleanText = rawText
        .replace(graphTagRegex,"")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

    let chartData: ChartDataPoint[] = [];

    try {
        // 마크다운 코드블록(```json ... ```)이 감싸져 있는 경우도 대비해 제거
        const normalizedJson = innerContent
            .replace(/^```(?:json)?\s*/i, "")
            .replace(/\s*```$/i, "")
            .trim();

        const parsed = JSON.parse(normalizedJson);

        // { "x": [...], "y": [...] } 형태
        if (
            parsed &&
            Array.isArray(parsed.x) &&
            Array.isArray(parsed.y)
        ) {
            const length = Math.min(parsed.x.length, parsed.y.length);
            const points: ChartDataPoint[] = [];

            for (let i = 0; i < length; i++) {
                const numY = Number(parsed.y[i]);
                if (!Number.isNaN(numY)) {
                    points.push({
                        x: String(parsed.x[i]),
                        y: numY,
                    });
                }
            }
            chartData = points;
        }
       
    } catch (error) {
        console.error("<GraphData> JSON 파싱 실패:", error);
    }

    return {
        cleanText,
        chartData,
        chartType,
    };
}