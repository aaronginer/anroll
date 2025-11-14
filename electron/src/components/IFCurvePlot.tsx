import { Area, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAppData } from "../data/app_data/AppData";

type IfCurvePlotData = {
  x: number[];
  y: number[];
};

type PlotPoint = {
  x: number;
  y: number;
};

function IFCurvePlot() {
    const appData = useAppData();

    function transformInputData(raw: IfCurvePlotData): PlotPoint[] {
        const mapped = raw.x.map((xValue, i) => ({
            x: xValue,
            y: raw.y[i],
        }));

        return mapped;
    };

    return <>
        {appData.state.dynamicState.plotIFCurveData != null &&
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={transformInputData(appData.state.dynamicState.plotIFCurveData)} width={400} height={400}  margin={{ left: -10,  bottom: -10, right: 10}}>
                    <YAxis domain={[0, 1]} tickLine={false} />
                    <XAxis dataKey="x" tick={false} tickLine={false} />

                    <Area name="Area" type="monotone" dataKey="y" stroke="none" fill="#777777" fillOpacity={0.2} isAnimationActive={false}/>
                    <Line name="Curve" type="monotone" dataKey="y" stroke="#0000ff" strokeWidth={2} dot={false} isAnimationActive={false} />
                    <Tooltip
                        // gpt assisted custom tooltip
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                const curveData = payload.find((item) => item.name === "Curve");
                                return (
                                    <div style={{ backgroundColor: "#fff", border: "1px solid #ccc", padding: "5px" }}>
                                        <p style={{ margin: 0, fontSize: 12 }}>
                                            <strong>X:</strong> {payload[0].payload.x.toFixed(3)}
                                        </p>
                                        <p style={{ margin: 0, fontSize: 12 }}>
                                            <strong>Y:</strong> {curveData.value.toFixed(3)}
                                        </p>
                                    </div>
                                );
                            }
                            return null;
                        }}    
                    />
                </ComposedChart>
            </ResponsiveContainer>
        }
    </>
}

export default IFCurvePlot;