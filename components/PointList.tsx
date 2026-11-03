type Point = {
  title: string
  body: string
}

type PointListProps = {
  points: Point[]
}

export function PointList({ points }: PointListProps) {
  return (
    <ul style={{ display: 'grid', gap: '0.8rem', margin: 0, padding: 0, listStyle: 'none' }}>
      {points.map((point) => (
        <li key={point.title}>
          <strong>{point.title}</strong>
          <div>{point.body}</div>
        </li>
      ))}
    </ul>
  )
}
