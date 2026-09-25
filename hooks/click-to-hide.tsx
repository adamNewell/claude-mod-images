import type { ClientModule } from 'claude-code'

/**
 * A picture's click target, drawn over it and drawing nothing, so its pixels
 * show through: a left button down then up inside it posts the picture's id.
 *
 * @param id the picture's id, which the hooks module's `ui.message` toggles
 */
const ClickToHide: ClientModule<string, true> = (id, surface) => {
  if (surface.state === undefined) {
    let isDown = false

    surface.onPointer(({ type, x, y, button }) => {
      if (type === 'down') {
        isDown = button === 'left'
      }

      if (type === 'up' && isDown) {
        isDown = false

        if (x >= 0 && y >= 0 && x < surface.columns && y < surface.rows) {
          surface.post(id)
        }
      }
    })

    surface.setState(true)
  }

  const { Box } = surface.elements

  return <Box />
}

export default ClickToHide
