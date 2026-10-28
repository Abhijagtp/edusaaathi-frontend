"use client";

import { useMemo, useState } from "react";
import { getMyPerformance } from "@/lib/consultant/mock-service";
import { useConsultantPortal } from "./consultant-provider";
import { MetricCard, PageHeader, PortalCard } from "./consultant-ui";
import styles from "./consultant.module.css";

const statusColors: Record<string, string> = { New: "#5a50d1", Contacted: "#3883b5", "In progress": "#d18620", Converted: "#258151", Lost: "#b64c4c" };

function PerformanceTrend({ data }: { data: Array<{ label: string; assigned: number; converted: number }> }) {
  const width = 720;
  const height = 225;
  const pad = { top: 20, right: 22, bottom: 36, left: 34 };
  const plotWidth = width - pad.left - pad.right;
  const plotHeight = height - pad.top - pad.bottom;
  const maximum = Math.max(2, ...data.map((point) => Math.max(point.assigned, point.converted)));
  const points = data.map((point, index) => ({
    ...point,
    x: pad.left + (data.length <= 1 ? plotWidth / 2 : (index / (data.length - 1)) * plotWidth),
    assignedY: pad.top + plotHeight - (point.assigned / maximum) * plotHeight,
    convertedY: pad.top + plotHeight - (point.converted / maximum) * plotHeight,
  }));
  const assignedPath = points.map((point, index) => `${index ? "L" : "M"}${point.x},${point.assignedY}`).join(" ");
  const convertedPath = points.map((point, index) => `${index ? "L" : "M"}${point.x},${point.convertedY}`).join(" ");
  const areaPath = points.length ? `${assignedPath} L${points[points.length - 1].x},${pad.top + plotHeight} L${points[0].x},${pad.top + plotHeight} Z` : "";
  return <div className={styles.chartBox}><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Six-month trend of assigned-lead cohorts and converted leads" preserveAspectRatio="none">
    {[0, 1, 2, 3].map((tick) => { const y = pad.top + (tick / 3) * plotHeight; const value = Math.round(maximum * (1 - tick / 3)); return <g key={tick}><line className={styles.chartGridLine} x1={pad.left} x2={width - pad.right} y1={y} y2={y} /><text className={styles.chartAxis} x={pad.left - 9} y={y + 3} textAnchor="end">{value}</text></g>; })}
    {areaPath ? <path d={areaPath} className={styles.chartAreaAssigned} /> : null}
    {assignedPath ? <path d={assignedPath} className={styles.chartLineAssigned} /> : null}
    {convertedPath ? <path d={convertedPath} className={styles.chartLineConverted} /> : null}
    {points.map((point) => <g key={point.label}><circle cx={point.x} cy={point.assignedY} r="3.5" className={styles.chartPointAssigned} /><text className={styles.chartAxis} x={point.x} y={height - 11} textAnchor="middle">{point.label}</text></g>)}
  </svg><div className={styles.chartLegend}><span><i />Assigned leads</span><span><i />Converted from cohort</span></div></div>;
}

export function ConsultantPerformancePage() {
  const portal = useConsultantPortal();
  const [rangeDays, setRangeDays] = useState(180);
  const performance = useMemo(() => getMyPerformance(portal, rangeDays), [portal.profile, portal.leads, portal.referralLeads, rangeDays]);
  const referralConverted = performance.referralsInRange.filter((lead) => lead.currentStatus === "Converted").length;
  const referralRate = performance.referralsInRange.length ? Math.round((referralConverted / performance.referralsInRange.length) * 100) : 0;

  return <div className={styles.pageStack}>
    <PageHeader eyebrow="PERSONAL INSIGHTS" title="My Performance" description="A private view of your assigned-lead outcomes, referral enquiries and counselor notes. No team or peer comparisons." actions={<label className={styles.filterControl}><span className={styles.srOnly}>Performance date range</span><select className={styles.rangeSelect} value={rangeDays} onChange={(event) => setRangeDays(Number(event.target.value))}><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option><option value={180}>Last 6 months</option><option value={365}>Last 12 months</option></select></label>} />
    {!portal.hydrated ? <PortalCard title="Loading personal performance"><p className={styles.tableMuted}>Calculating your assigned-lead data…</p></PortalCard> : <>
      <section className={styles.metricGrid} aria-label="Personal performance totals for the selected period">
        <MetricCard label="Leads handled" value={performance.totalAssigned} note="Assigned in selected period" icon="users" />
        <MetricCard label="Leads contacted" value={performance.contacted} note="In the same assigned cohort" icon="phone" tone="blue" />
        <MetricCard label="Leads converted" value={performance.converted} note="From your assigned cohort" icon="check-circle" tone="green" />
        <MetricCard label="Conversion rate" value={`${performance.conversionRate}%`} note="Converted ÷ assigned in period" icon="target" tone="purple" />
        <MetricCard label="Referral leads generated" value={performance.referralLeads} note="Attributed to your code" icon="link" tone="amber" />
        <MetricCard label="Counselor notes logged" value={performance.notesLogged} note="Logged in selected period" icon="note" tone="rose" />
      </section>

      <div className={styles.chartGrid}>
        <PortalCard title="Leads captured over time" subtitle="Monthly assignment cohort and current conversions">
          <PerformanceTrend data={performance.months} />
          <p className={styles.performanceNote}>A lead is counted in its month of assignment. Converted counts show how many leads in that cohort are currently marked Converted.</p>
        </PortalCard>
        <PortalCard title="Lead status distribution" subtitle={`Current status of ${performance.totalAssigned} leads assigned in the selected period`}>
          <div className={styles.distributionList} role="list" aria-label="Lead status distribution">
            {performance.statusDistribution.map((item) => <div className={styles.distributionRow} role="listitem" key={item.status}><span>{item.status}</span><div className={styles.distributionTrack}><i style={{ width: `${performance.totalAssigned ? (item.count / performance.totalAssigned) * 100 : 0}%`, background: statusColors[item.status] }} /></div><strong>{item.count}</strong></div>)}
          </div>
          {!performance.totalAssigned ? <p className={styles.performanceNote}>No assigned leads fall within this date range yet.</p> : null}
        </PortalCard>
      </div>

      <div className={styles.dashboardBottom}>
        <PortalCard title="Monthly performance" subtitle="Lead cohort outcomes and counseling notes">
          {performance.months.length ? <div className={styles.tableViewport}><table className={styles.dataTable}>
            <caption className={styles.srOnly}>Personal monthly performance for the most recent six months</caption>
            <thead><tr><th scope="col">Month</th><th scope="col">Leads assigned</th><th scope="col">Leads contacted</th><th scope="col">Leads converted</th><th scope="col">Conversion rate</th><th scope="col">Notes logged</th></tr></thead>
            <tbody>{performance.months.map((month) => <tr key={month.key}><td><strong className={styles.tableMainText}>{month.label} {month.key.slice(0, 4)}</strong></td><td>{month.assigned}</td><td>{month.contacted}</td><td>{month.converted}</td><td>{month.assigned ? `${Math.round((month.converted / month.assigned) * 100)}%` : "—"}</td><td>{month.notesLogged}</td></tr>)}</tbody>
          </table></div> : null}
          <p className={styles.performanceNote}>Monthly conversion rate is based on the current status of leads assigned in that month. Notes logged are counted across student interactions.</p>
        </PortalCard>
        <PortalCard title="Referral lead performance" subtitle="Referral attribution is separate from assignment">
          <div className={styles.performanceReferral}>
            <div><span>Captured referral enquiries</span><strong>{performance.referralsInRange.length}</strong></div>
            <div><span>Currently converted</span><strong>{referralConverted}</strong></div>
            <div><span>Referral conversion rate</span><strong>{referralRate}%</strong></div>
          </div>
          <p className={styles.performanceNote}>Referral leads are counted when a submitted enquiry is attributed to your code. They may be assigned to another consultant, so they are not added to your assigned-lead totals.</p>
        </PortalCard>
      </div>
      <p className={styles.performanceNote}>All metrics are sample data stored in this browser. They are personal mock figures, not organization-wide reporting or verified admission outcomes.</p>
    </>}
  </div>;
}
