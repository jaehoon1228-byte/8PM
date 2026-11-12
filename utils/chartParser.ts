import * as XLSX from "xlsx"

// 차트 데이터 한 건의 구조 정의
export interface ChartDataPoint {
    label: string;
    value: number;
}

export default function parseFileToChartData(file: File): Promise<ChartDataPoint[]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        const fileName = file.name.toLowerCase();

        // 엑셀 및 CSV 파일 처리
        if(fileName.endsWith('.xlsx') || fileName.endsWith(".xls") || fileName.endsWith(".csv")) {
            reader.onload = (e) => {
                try {
                    const buffer = e.target?.result;
                    const workbook = XLSX.read(buffer, {type:"binary"});
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

                    const formatted: ChartDataPoint[] = json.map((row) => {
                        const keys = Object.keys(row);
                        return {
                            label: String(row[keys[0]] ?? ""),
                            value: Number(row[keys[1]] ?? 0)
                        }
                    })
                    resolve(formatted);
                } catch(err) {
                    reject(err);
                }
            }
            reader.onerror = (error) => reject(error);
            reader.readAsArrayBuffer(file);
        }

        // JSON 또는 HTML 파일 처리
        else {
            reader.onload = (e) => {
                const text = e.target?.result as string;
                try {
                    const json = JSON.parse(text);
                    if(Array.isArray(json)) {
                        resolve(json);
                        return;
                    }
                } catch {
                    try {
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(text, "text/html");
                        const rows = doc.querySelectorAll("tr");
                        const parsedData: ChartDataPoint[] = [];

                        rows.forEach((row, index) => {
                            const cols = row.querySelectorAll("th, td");
                            if(cols.length >= 2) {
                                const label = cols[0].textContent?.trim() || "";
                                const value = Number(cols[1].textContent?.trim()) || 0;
                                if(index > 0 || isNaN(Number(label))) {
                                    parsedData.push({label, value});
                                }
                            }
                        })
                        resolve(parsedData);
                        return;
                    } catch(htmlErr) {
                        reject(htmlErr);
                    }
                }
                reject(new Error("파싱할 수 없는 데이터 형식입니다."))
            }
            // 파일을 텍스트로 읽기 시작
            reader.readAsText(file)
        }
    })
}