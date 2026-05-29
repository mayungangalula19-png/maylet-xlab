export const StatsCard = ({ title, value, icon }: { title: string; value: string; icon: string }) => { return <div className="stats-card"><div>{icon}</div><h3>{title}</h3><p>{value}</p></div>; };
