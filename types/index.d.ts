/**
 * Whether the person hid a picture: a member per picture, its `id` the call's
 * tool_use_id or the prompt's message id with the picture's place, so a
 * group's line and the call's own row agree.
 */
export type ImagesIsHidden = boolean

/**
 * Whether `/images off` stopped every picture for the session.
 */
export type ImagesIsOff = boolean

declare module 'claude-code' {
  interface PluginState {
    images: { isHidden: StateFamily<ImagesIsHidden>; isOff: ImagesIsOff }
  }
}
