import { describe, expect, test, tier } from 'claude-code/testing'

import { sentFilesOf } from '../hooks/sent-files-of'

tier('user')

const send = (attachments: unknown, tool = 'SendUserFile') => ({
  tool_use_id: 'send',
  tool,
  output: { caption: 'look', attachments },
})

describe('sent-files-of', () => {
  test('each image attachment is a file named for its path, in order', () => {
    expect(
      sentFilesOf(
        send([
          { path: '/tmp/a.png', isImage: true, media_type: 'image/png' },
          { path: '/tmp/notes.txt', isImage: false, media_type: 'text/plain' },
          { path: '/tmp/b.jpg', isImage: true, media_type: 'image/jpeg' },
        ]),
      ),
    ).toEqual([
      { id: 'send#0', path: '/tmp/a.png', mediaType: 'image/png', name: 'a.png' },
      { id: 'send#1', path: '/tmp/b.jpg', mediaType: 'image/jpeg', name: 'b.jpg' },
    ])
  })

  test('a running call, another tool and a call with no id are no files', () => {
    const image = [{ path: '/tmp/a.png', isImage: true, media_type: 'image/png' }]

    expect(sentFilesOf({ tool_use_id: 'send', tool: 'SendUserFile' })).toEqual([])
    expect(sentFilesOf(send(image, 'Read'))).toEqual([])
    expect(sentFilesOf({ tool: 'SendUserFile', output: { attachments: image } })).toEqual([])
  })
})
