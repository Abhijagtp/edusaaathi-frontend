import styles from "./admin.module.css";

export type ChartPoint = { label: string; value: number };
export type ChartSlice = { label: string; value: number; color: string };

export function LeadTrendChart({ data, label = "Lead acquisition trend" }: { data: ChartPoint[]; label?: string }) {
  const width = 720;
  const height = 250;
  const padding = { top: 18, right: 20, bottom: 38, left: 38 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const maximum = Math.max(4, ...data.map((point) => point.value));
  const points = data.map((point, index) => ({
    ...point,
    x: padding.left + (data.length <= 1 ? plotWidth / 2 : (index / (data.length - 1)) * plotWidth),
    y: padding.top + plotHeight - (point.value / maximum) * plotHeight,
  }));
  const linePath = points.map((point, index) => `${index ? "L" : "M"}${point.x},${point.y}`).join(" ");
  const areaPath = points.length ? `${linePath} L${points[points.length - 1].x},${padding.top + plotHeight} L${points[0].x},${padding.top + plotHeight} Z` : "";
  return (
    <div className={styles.chartCanvas}>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label} preserveAspectRatio="none">
        {[0, 1, 2, 3].map((line) => {
          const y = padding.top + (line / 3) * plotHeight;
          const tick = Math.round(maximum - (line / 3) * maximum);
          return <g key={line}><line x1={padding.left} x2={width - padding.right} y1={y} y2={y} className={styles.chartGridLine} /><text x={padding.left - 12} y={y + 4} textAnchor="end" className={styles.chartAxisText}>{tick}</text></g>;
        })}
        {areaPath ? <path d={areaPath} className={styles.chartArea} /> : null}
        {linePath ? <path d={linePath} className={styles.chartLine} /> : null}
        {points.map((point) => <g key={`${point.label}-${point.x}`}><circle cx={point.x} cy={point.y} r="4" className={styles.chartPoint} /><text x={point.x} y={height - 12} textAnchor="middle" className={styles.chartAxisText}>{point.label}</text></g>)}
      </svg>
    </div>
  );
}

export function SourceDonut({ data, total, label = "Lead source distribution" }: { data: ChartSlice[]; total: number; label?: string }) {
  const radius = 43;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <div className={styles.donutWrap}>
      <svg viewBox="0 0 120 120" role="img" aria-label={label} className={styles.donutChart}>
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#EEF0F5" strokeWidth="13" />
        {data.filter((item) => item.value > 0).map((item) => {
          const dash = (item.value / Math.max(total, 1)) * circumference;
          const currentOffset = offset;
          offset += dash;
          return <circle key={item.label} cx="60" cy="60" r={radius} fill="none" stroke={item.color} strokeWidth="13" strokeDasharray={`${dash} ${circumference - dash}`} strokeDashoffset={-currentOffset} transform="rotate(-90 60 60)" />;
        })}
        <text x="60" y="56" textAnchor="middle" className={styles.donutTotal}>{total}</text>
        <text x="60" y="71" textAnchor="middle" className={styles.donutCaption}>LEADS</text>
      </svg>
      <div className={styles.donutLegend}>{data.map((item) => <div key={item.label}><span style={{ backgroundColor: item.color }} /><span>{item.label}</span><strong>{total ? Math.round((item.value / total) * 100) : 0}%</strong></div>)}</div>
    </div>
  );
}

export function HorizontalBars({ data, label = "Distribution" }: { data: Array<{ label: string; value: number; color?: string }>; label?: string }) {
  const maximum = Math.max(1, ...data.map((item) => item.value));
  return <div className={styles.barList} role="figure" aria-label={label}>{data.map((item) => <div className={styles.barRow} key={item.label}><div className={styles.barLabel}><span>{item.label}</span><strong>{item.value}</strong></div><div className={styles.barTrack}><span style={{ width: `${(item.value / maximum) * 100}%`, backgroundColor: item.color || "#5146DC" }} /></div></div>)}</div>;
}
