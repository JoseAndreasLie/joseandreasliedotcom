import { Button, FrameCounter } from '../../components/ui'
import { SITE } from '../../data/portfolio'

export default function NotFound() {
  return (
    <div className="container page-stub">
      <title>{`Not found · ${SITE}`}</title>
      <meta name="robots" content="noindex" />
      <meta name="description" content="This page does not exist on jose.web.id." />
      <FrameCounter index={404} />
      <h1 className="t-display">
        Frame <em>not found</em>
      </h1>
      <p className="t-dim">This page is not on the roll.</p>
      <div className="page-actions">
        <Button to="/">Back to home</Button>
        <Button to="/projects">See the projects</Button>
      </div>
    </div>
  )
}
