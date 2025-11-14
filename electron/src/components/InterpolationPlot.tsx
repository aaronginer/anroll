import { ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAppData } from "../data/app_data/AppData";

type InterpPlotData = {
  x: number[];
  y_contour: number[];
  y_interp: number[];
  y_linear: number[];
};

type PlotPoint = {
  x: number;
  y_contour: number;
  y_interp: number;
  y_linear: number;
};

function InterpolationPlot() {
    const appData = useAppData();

    function transformInputData(raw: InterpPlotData): PlotPoint[] {
        const mapped = raw.x.map((xValue, i) => ({
            x: xValue,
            y_contour: raw.y_contour[i],
            y_interp: raw.y_interp[i],
            y_linear: raw.y_linear[i],
        }));

        return mapped;
    };

    let xDomain = [0, 1];
    let yDomain = [0, 1];
    if (appData.state.dynamicState.plotInterpData != null) {
        xDomain = [Math.min(...appData.state.dynamicState.plotInterpData.x), Math.max(...appData.state.dynamicState.plotInterpData.x)];
        yDomain = [Math.min(...[...appData.state.dynamicState.plotInterpData.y_contour, ...appData.state.dynamicState.plotInterpData.y_interp, ...appData.state.dynamicState.plotInterpData.y_linear]), 
                   Math.max(...[...appData.state.dynamicState.plotInterpData.y_contour, ...appData.state.dynamicState.plotInterpData.y_interp, ...appData.state.dynamicState.plotInterpData.y_linear])];
    }
    
    return <>
        {appData.state.dynamicState.plotInterpData != null &&
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                    layout="vertical"
                    data={transformInputData(appData.state.dynamicState.plotInterpData)}
                    margin={{ left: -50, bottom: -10, right: 10 }}
                    >
                    <XAxis type="number" tick={false} tickLine={false} allowDataOverflow={false} domain={yDomain}/>

                    <YAxis dataKey="x" type="number" tick={false} tickLine={false} allowDataOverflow={false} domain={xDomain}/>

                    <Line name="Radius" type="monotone" dataKey="y_contour" stroke="#ff7070ff" dot={false} isAnimationActive={false} />
                    <Line name="Interpolation" type="monotone" dataKey="y_interp" stroke="#ff00ff" dot={false} isAnimationActive={false} />
                    <Line name="Linear Fit" type="monotone" dataKey="y_linear" stroke="#00ff00" dot={false} isAnimationActive={false} />
                    <Legend wrapperStyle={{ marginLeft: 40, marginBottom: '20px', fontSize: 9 }}/>
                    <Tooltip 
                        // gpt assisted custom tooltip
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                return (
                                    <div style={{ backgroundColor: "#666", border: "1px solid #555", padding: "5px" }}>
                                        <p style={{ margin: 0, fontSize: 12 }}>
                                            <strong>Arc-Length:</strong> {payload[0].payload.x.toFixed(3)}
                                        </p>
                                        {payload.map((item, index) => (
                                            <p key={index} style={{fontSize: 12, margin: 0, color: item.color}}>
                                                <strong>{item.name}:</strong> {item.value.toFixed(3)}
                                            </p>
                                        ))}
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

export default InterpolationPlot;