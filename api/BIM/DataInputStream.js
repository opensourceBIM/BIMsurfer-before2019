	// Mimicking Java DataInputStream
	function DataInputStream(arrayBuffer) {
		var othis = this;
		var dataView = new DataView(arrayBuffer);
		othis.pos = 0;

		othis.readUTF8 = function() {
			var length = dataView.getInt16(othis.pos);
			othis.pos += 2;
			var view = arrayBuffer.slice(othis.pos, othis.pos + length);
			var result = new StringView(view).toString();
			othis.pos += length;
			return result;
		}
		
		othis.align4 = function() {
			// Skips to the next alignment of 4 (source should have done the same!)
			var skip = 4 - (othis.pos % 4);
			if(skip > 0 && skip != 4) {
				othis.pos += skip;
			}
		}

		othis.readFloat = function() {
			var value = dataView.getFloat32(othis.pos);
			othis.pos += 4;
			return value;
		}
		
		othis.readInt = function() {
			var value = dataView.getInt32(othis.pos);
			othis.pos += 4;
			return value;
		}

		othis.readByte = function() {
			var value = dataView.getInt8(othis.pos);
			othis.pos += 1;
			return value;
		}

		othis.readLong = function() {
			// We are throwing away the first 4 bytes here...
			var value = dataView.getInt32(othis.pos + 4);
			othis.pos += 8;
			return value;
		}
		
		othis.readFloatArray = function(length) {
			var result = new Float32Array(arrayBuffer, othis.pos, length);
			othis.pos += length * 4;
			return result;
		}
	}