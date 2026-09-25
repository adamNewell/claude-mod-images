// (c) Dean McNamee <dean@gmail.com>, 2013.
//
// https://github.com/deanm/omggif
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
// IN THE SOFTWARE.
//
// omggif is a JavaScript implementation of a GIF 89a encoder and decoder,
// including animation and compression.  It does not rely on any specific
// underlying system, so should run in the browser, Node, or Plask.
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);

// node_modules/omggif/omggif.js
var require_omggif = __commonJS(function(exports) {
  function GifWriter(buf, width, height, gopts) {
    var p = 0;
    var gopts = gopts === undefined ? {} : gopts;
    var loop_count = gopts.loop === undefined ? null : gopts.loop;
    var global_palette = gopts.palette === undefined ? null : gopts.palette;
    if (width <= 0 || height <= 0 || width > 65535 || height > 65535)
      throw new Error("Width/Height invalid.");
    function check_palette_and_num_colors(palette) {
      var num_colors = palette.length;
      if (num_colors < 2 || num_colors > 256 || num_colors & num_colors - 1) {
        throw new Error("Invalid code/color length, must be power of 2 and 2 .. 256.");
      }
      return num_colors;
    }
    buf[p++] = 71;
    buf[p++] = 73;
    buf[p++] = 70;
    buf[p++] = 56;
    buf[p++] = 57;
    buf[p++] = 97;
    var gp_num_colors_pow2 = 0;
    var background = 0;
    if (global_palette !== null) {
      var gp_num_colors = check_palette_and_num_colors(global_palette);
      while (gp_num_colors >>= 1)
        ++gp_num_colors_pow2;
      gp_num_colors = 1 << gp_num_colors_pow2;
      --gp_num_colors_pow2;
      if (gopts.background !== undefined) {
        background = gopts.background;
        if (background >= gp_num_colors)
          throw new Error("Background index out of range.");
        if (background === 0)
          throw new Error("Background index explicitly passed as 0.");
      }
    }
    buf[p++] = width & 255;
    buf[p++] = width >> 8 & 255;
    buf[p++] = height & 255;
    buf[p++] = height >> 8 & 255;
    buf[p++] = (global_palette !== null ? 128 : 0) | gp_num_colors_pow2;
    buf[p++] = background;
    buf[p++] = 0;
    if (global_palette !== null) {
      for (var i = 0, il = global_palette.length;i < il; ++i) {
        var rgb = global_palette[i];
        buf[p++] = rgb >> 16 & 255;
        buf[p++] = rgb >> 8 & 255;
        buf[p++] = rgb & 255;
      }
    }
    if (loop_count !== null) {
      if (loop_count < 0 || loop_count > 65535)
        throw new Error("Loop count invalid.");
      buf[p++] = 33;
      buf[p++] = 255;
      buf[p++] = 11;
      buf[p++] = 78;
      buf[p++] = 69;
      buf[p++] = 84;
      buf[p++] = 83;
      buf[p++] = 67;
      buf[p++] = 65;
      buf[p++] = 80;
      buf[p++] = 69;
      buf[p++] = 50;
      buf[p++] = 46;
      buf[p++] = 48;
      buf[p++] = 3;
      buf[p++] = 1;
      buf[p++] = loop_count & 255;
      buf[p++] = loop_count >> 8 & 255;
      buf[p++] = 0;
    }
    var ended = false;
    this.addFrame = function(x, y, w, h, indexed_pixels, opts) {
      if (ended === true) {
        --p;
        ended = false;
      }
      opts = opts === undefined ? {} : opts;
      if (x < 0 || y < 0 || x > 65535 || y > 65535)
        throw new Error("x/y invalid.");
      if (w <= 0 || h <= 0 || w > 65535 || h > 65535)
        throw new Error("Width/Height invalid.");
      if (indexed_pixels.length < w * h)
        throw new Error("Not enough pixels for the frame size.");
      var using_local_palette = true;
      var palette = opts.palette;
      if (palette === undefined || palette === null) {
        using_local_palette = false;
        palette = global_palette;
      }
      if (palette === undefined || palette === null)
        throw new Error("Must supply either a local or global palette.");
      var num_colors = check_palette_and_num_colors(palette);
      var min_code_size = 0;
      while (num_colors >>= 1)
        ++min_code_size;
      num_colors = 1 << min_code_size;
      var delay = opts.delay === undefined ? 0 : opts.delay;
      var disposal = opts.disposal === undefined ? 0 : opts.disposal;
      if (disposal < 0 || disposal > 3)
        throw new Error("Disposal out of range.");
      var use_transparency = false;
      var transparent_index = 0;
      if (opts.transparent !== undefined && opts.transparent !== null) {
        use_transparency = true;
        transparent_index = opts.transparent;
        if (transparent_index < 0 || transparent_index >= num_colors)
          throw new Error("Transparent color index.");
      }
      if (disposal !== 0 || use_transparency || delay !== 0) {
        buf[p++] = 33;
        buf[p++] = 249;
        buf[p++] = 4;
        buf[p++] = disposal << 2 | (use_transparency === true ? 1 : 0);
        buf[p++] = delay & 255;
        buf[p++] = delay >> 8 & 255;
        buf[p++] = transparent_index;
        buf[p++] = 0;
      }
      buf[p++] = 44;
      buf[p++] = x & 255;
      buf[p++] = x >> 8 & 255;
      buf[p++] = y & 255;
      buf[p++] = y >> 8 & 255;
      buf[p++] = w & 255;
      buf[p++] = w >> 8 & 255;
      buf[p++] = h & 255;
      buf[p++] = h >> 8 & 255;
      buf[p++] = using_local_palette === true ? 128 | min_code_size - 1 : 0;
      if (using_local_palette === true) {
        for (var i2 = 0, il2 = palette.length;i2 < il2; ++i2) {
          var rgb2 = palette[i2];
          buf[p++] = rgb2 >> 16 & 255;
          buf[p++] = rgb2 >> 8 & 255;
          buf[p++] = rgb2 & 255;
        }
      }
      p = GifWriterOutputLZWCodeStream(buf, p, min_code_size < 2 ? 2 : min_code_size, indexed_pixels);
      return p;
    };
    this.end = function() {
      if (ended === false) {
        buf[p++] = 59;
        ended = true;
      }
      return p;
    };
    this.getOutputBuffer = function() {
      return buf;
    };
    this.setOutputBuffer = function(v) {
      buf = v;
    };
    this.getOutputBufferPosition = function() {
      return p;
    };
    this.setOutputBufferPosition = function(v) {
      p = v;
    };
  }
  function GifWriterOutputLZWCodeStream(buf, p, min_code_size, index_stream) {
    buf[p++] = min_code_size;
    var cur_subblock = p++;
    var clear_code = 1 << min_code_size;
    var code_mask = clear_code - 1;
    var eoi_code = clear_code + 1;
    var next_code = eoi_code + 1;
    var cur_code_size = min_code_size + 1;
    var cur_shift = 0;
    var cur = 0;
    function emit_bytes_to_buffer(bit_block_size) {
      while (cur_shift >= bit_block_size) {
        buf[p++] = cur & 255;
        cur >>= 8;
        cur_shift -= 8;
        if (p === cur_subblock + 256) {
          buf[cur_subblock] = 255;
          cur_subblock = p++;
        }
      }
    }
    function emit_code(c) {
      cur |= c << cur_shift;
      cur_shift += cur_code_size;
      emit_bytes_to_buffer(8);
    }
    var ib_code = index_stream[0] & code_mask;
    var code_table = {};
    emit_code(clear_code);
    for (var i = 1, il = index_stream.length;i < il; ++i) {
      var k = index_stream[i] & code_mask;
      var cur_key = ib_code << 8 | k;
      var cur_code = code_table[cur_key];
      if (cur_code === undefined) {
        cur |= ib_code << cur_shift;
        cur_shift += cur_code_size;
        while (cur_shift >= 8) {
          buf[p++] = cur & 255;
          cur >>= 8;
          cur_shift -= 8;
          if (p === cur_subblock + 256) {
            buf[cur_subblock] = 255;
            cur_subblock = p++;
          }
        }
        if (next_code === 4096) {
          emit_code(clear_code);
          next_code = eoi_code + 1;
          cur_code_size = min_code_size + 1;
          code_table = {};
        } else {
          if (next_code >= 1 << cur_code_size)
            ++cur_code_size;
          code_table[cur_key] = next_code++;
        }
        ib_code = k;
      } else {
        ib_code = cur_code;
      }
    }
    emit_code(ib_code);
    emit_code(eoi_code);
    emit_bytes_to_buffer(1);
    if (cur_subblock + 1 === p) {
      buf[cur_subblock] = 0;
    } else {
      buf[cur_subblock] = p - cur_subblock - 1;
      buf[p++] = 0;
    }
    return p;
  }
  function GifReader(buf) {
    var p = 0;
    if (buf[p++] !== 71 || buf[p++] !== 73 || buf[p++] !== 70 || buf[p++] !== 56 || (buf[p++] + 1 & 253) !== 56 || buf[p++] !== 97) {
      throw new Error("Invalid GIF 87a/89a header.");
    }
    var width = buf[p++] | buf[p++] << 8;
    var height = buf[p++] | buf[p++] << 8;
    var pf0 = buf[p++];
    var global_palette_flag = pf0 >> 7;
    var num_global_colors_pow2 = pf0 & 7;
    var num_global_colors = 1 << num_global_colors_pow2 + 1;
    var background = buf[p++];
    buf[p++];
    var global_palette_offset = null;
    var global_palette_size = null;
    if (global_palette_flag) {
      global_palette_offset = p;
      global_palette_size = num_global_colors;
      p += num_global_colors * 3;
    }
    var no_eof = true;
    var frames = [];
    var delay = 0;
    var transparent_index = null;
    var disposal = 0;
    var loop_count = null;
    this.width = width;
    this.height = height;
    while (no_eof && p < buf.length) {
      switch (buf[p++]) {
        case 33:
          switch (buf[p++]) {
            case 255:
              if (buf[p] !== 11 || buf[p + 1] == 78 && buf[p + 2] == 69 && buf[p + 3] == 84 && buf[p + 4] == 83 && buf[p + 5] == 67 && buf[p + 6] == 65 && buf[p + 7] == 80 && buf[p + 8] == 69 && buf[p + 9] == 50 && buf[p + 10] == 46 && buf[p + 11] == 48 && buf[p + 12] == 3 && buf[p + 13] == 1 && buf[p + 16] == 0) {
                p += 14;
                loop_count = buf[p++] | buf[p++] << 8;
                p++;
              } else {
                p += 12;
                while (true) {
                  var block_size = buf[p++];
                  if (!(block_size >= 0))
                    throw Error("Invalid block size");
                  if (block_size === 0)
                    break;
                  p += block_size;
                }
              }
              break;
            case 249:
              if (buf[p++] !== 4 || buf[p + 4] !== 0)
                throw new Error("Invalid graphics extension block.");
              var pf1 = buf[p++];
              delay = buf[p++] | buf[p++] << 8;
              transparent_index = buf[p++];
              if ((pf1 & 1) === 0)
                transparent_index = null;
              disposal = pf1 >> 2 & 7;
              p++;
              break;
            case 254:
              while (true) {
                var block_size = buf[p++];
                if (!(block_size >= 0))
                  throw Error("Invalid block size");
                if (block_size === 0)
                  break;
                p += block_size;
              }
              break;
            default:
              throw new Error("Unknown graphic control label: 0x" + buf[p - 1].toString(16));
          }
          break;
        case 44:
          var x = buf[p++] | buf[p++] << 8;
          var y = buf[p++] | buf[p++] << 8;
          var w = buf[p++] | buf[p++] << 8;
          var h = buf[p++] | buf[p++] << 8;
          var pf2 = buf[p++];
          var local_palette_flag = pf2 >> 7;
          var interlace_flag = pf2 >> 6 & 1;
          var num_local_colors_pow2 = pf2 & 7;
          var num_local_colors = 1 << num_local_colors_pow2 + 1;
          var palette_offset = global_palette_offset;
          var palette_size = global_palette_size;
          var has_local_palette = false;
          if (local_palette_flag) {
            var has_local_palette = true;
            palette_offset = p;
            palette_size = num_local_colors;
            p += num_local_colors * 3;
          }
          var data_offset = p;
          p++;
          while (true) {
            var block_size = buf[p++];
            if (!(block_size >= 0))
              throw Error("Invalid block size");
            if (block_size === 0)
              break;
            p += block_size;
          }
          frames.push({
            x,
            y,
            width: w,
            height: h,
            has_local_palette,
            palette_offset,
            palette_size,
            data_offset,
            data_length: p - data_offset,
            transparent_index,
            interlaced: !!interlace_flag,
            delay,
            disposal
          });
          break;
        case 59:
          no_eof = false;
          break;
        default:
          throw new Error("Unknown gif block: 0x" + buf[p - 1].toString(16));
          break;
      }
    }
    this.numFrames = function() {
      return frames.length;
    };
    this.loopCount = function() {
      return loop_count;
    };
    this.frameInfo = function(frame_num) {
      if (frame_num < 0 || frame_num >= frames.length)
        throw new Error("Frame index out of range.");
      return frames[frame_num];
    };
    this.decodeAndBlitFrameBGRA = function(frame_num, pixels) {
      var frame = this.frameInfo(frame_num);
      var num_pixels = frame.width * frame.height;
      var index_stream = new Uint8Array(num_pixels);
      GifReaderLZWOutputIndexStream(buf, frame.data_offset, index_stream, num_pixels);
      var palette_offset2 = frame.palette_offset;
      var trans = frame.transparent_index;
      if (trans === null)
        trans = 256;
      var framewidth = frame.width;
      var framestride = width - framewidth;
      var xleft = framewidth;
      var opbeg = (frame.y * width + frame.x) * 4;
      var opend = ((frame.y + frame.height) * width + frame.x) * 4;
      var op = opbeg;
      var scanstride = framestride * 4;
      if (frame.interlaced === true) {
        scanstride += width * 4 * 7;
      }
      var interlaceskip = 8;
      for (var i = 0, il = index_stream.length;i < il; ++i) {
        var index = index_stream[i];
        if (xleft === 0) {
          op += scanstride;
          xleft = framewidth;
          if (op >= opend) {
            scanstride = framestride * 4 + width * 4 * (interlaceskip - 1);
            op = opbeg + (framewidth + framestride) * (interlaceskip << 1);
            interlaceskip >>= 1;
          }
        }
        if (index === trans) {
          op += 4;
        } else {
          var r = buf[palette_offset2 + index * 3];
          var g = buf[palette_offset2 + index * 3 + 1];
          var b = buf[palette_offset2 + index * 3 + 2];
          pixels[op++] = b;
          pixels[op++] = g;
          pixels[op++] = r;
          pixels[op++] = 255;
        }
        --xleft;
      }
    };
    this.decodeAndBlitFrameRGBA = function(frame_num, pixels) {
      var frame = this.frameInfo(frame_num);
      var num_pixels = frame.width * frame.height;
      var index_stream = new Uint8Array(num_pixels);
      GifReaderLZWOutputIndexStream(buf, frame.data_offset, index_stream, num_pixels);
      var palette_offset2 = frame.palette_offset;
      var trans = frame.transparent_index;
      if (trans === null)
        trans = 256;
      var framewidth = frame.width;
      var framestride = width - framewidth;
      var xleft = framewidth;
      var opbeg = (frame.y * width + frame.x) * 4;
      var opend = ((frame.y + frame.height) * width + frame.x) * 4;
      var op = opbeg;
      var scanstride = framestride * 4;
      if (frame.interlaced === true) {
        scanstride += width * 4 * 7;
      }
      var interlaceskip = 8;
      for (var i = 0, il = index_stream.length;i < il; ++i) {
        var index = index_stream[i];
        if (xleft === 0) {
          op += scanstride;
          xleft = framewidth;
          if (op >= opend) {
            scanstride = framestride * 4 + width * 4 * (interlaceskip - 1);
            op = opbeg + (framewidth + framestride) * (interlaceskip << 1);
            interlaceskip >>= 1;
          }
        }
        if (index === trans) {
          op += 4;
        } else {
          var r = buf[palette_offset2 + index * 3];
          var g = buf[palette_offset2 + index * 3 + 1];
          var b = buf[palette_offset2 + index * 3 + 2];
          pixels[op++] = r;
          pixels[op++] = g;
          pixels[op++] = b;
          pixels[op++] = 255;
        }
        --xleft;
      }
    };
  }
  function GifReaderLZWOutputIndexStream(code_stream, p, output, output_length) {
    var min_code_size = code_stream[p++];
    var clear_code = 1 << min_code_size;
    var eoi_code = clear_code + 1;
    var next_code = eoi_code + 1;
    var cur_code_size = min_code_size + 1;
    var code_mask = (1 << cur_code_size) - 1;
    var cur_shift = 0;
    var cur = 0;
    var op = 0;
    var subblock_size = code_stream[p++];
    var code_table = new Int32Array(4096);
    var prev_code = null;
    while (true) {
      while (cur_shift < 16) {
        if (subblock_size === 0)
          break;
        cur |= code_stream[p++] << cur_shift;
        cur_shift += 8;
        if (subblock_size === 1) {
          subblock_size = code_stream[p++];
        } else {
          --subblock_size;
        }
      }
      if (cur_shift < cur_code_size)
        break;
      var code = cur & code_mask;
      cur >>= cur_code_size;
      cur_shift -= cur_code_size;
      if (code === clear_code) {
        next_code = eoi_code + 1;
        cur_code_size = min_code_size + 1;
        code_mask = (1 << cur_code_size) - 1;
        prev_code = null;
        continue;
      } else if (code === eoi_code) {
        break;
      }
      var chase_code = code < next_code ? code : prev_code;
      var chase_length = 0;
      var chase = chase_code;
      while (chase > clear_code) {
        chase = code_table[chase] >> 8;
        ++chase_length;
      }
      var k = chase;
      var op_end = op + chase_length + (chase_code !== code ? 1 : 0);
      if (op_end > output_length) {
        console.log("Warning, gif stream longer than expected.");
        return;
      }
      output[op++] = k;
      op += chase_length;
      var b = op;
      if (chase_code !== code)
        output[op++] = k;
      chase = chase_code;
      while (chase_length--) {
        chase = code_table[chase];
        output[--b] = chase & 255;
        chase >>= 8;
      }
      if (prev_code !== null && next_code < 4096) {
        code_table[next_code++] = prev_code << 8 | k;
        if (next_code >= code_mask + 1 && cur_code_size < 12) {
          ++cur_code_size;
          code_mask = code_mask << 1 | 1;
        }
      }
      prev_code = code;
    }
    if (op !== output_length) {
      console.log("Warning, gif stream shorter than expected.");
    }
    return output;
  }
  try {
    exports.GifWriter = GifWriter;
    exports.GifReader = GifReader;
  } catch (e) {}
});
export default require_omggif();
