import { Button, FrameCounter } from '../../components/ui'

export default function NotFound() {
  return (
    <div className="container page-stub">
      <title>Not found · Jose Andreas Lie</title>
      <meta name="robots" content="noindex" />
      <meta name="description" content="This page does not exist on jose.web.id." />
      <FrameCounter index={404} />
      <h1 className="t-display">
        Frame <em>not found</em>
      </h1>
      <p className="t-dim">This page is not on the roll.</p>
      <div>
        <Button to="/">Back to home</Button>
      </div>
    </div>
  )
}
