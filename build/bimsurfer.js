(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('xeogl'), require('bimserverapi')) :
	typeof define === 'function' && define.amd ? define(['exports', 'xeogl', 'bimserverapi'], factory) :
	(factory((global.bimsurfer = {}),null,global.BimServerClient));
}(this, (function (exports,xeogl$1,BimServerClient) { 'use strict';

BimServerClient = BimServerClient && BimServerClient.hasOwnProperty('default') ? BimServerClient['default'] : BimServerClient;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};





var asyncGenerator = function () {
  function AwaitValue(value) {
    this.value = value;
  }

  function AsyncGenerator(gen) {
    var front, back;

    function send(key, arg) {
      return new Promise(function (resolve, reject) {
        var request = {
          key: key,
          arg: arg,
          resolve: resolve,
          reject: reject,
          next: null
        };

        if (back) {
          back = back.next = request;
        } else {
          front = back = request;
          resume(key, arg);
        }
      });
    }

    function resume(key, arg) {
      try {
        var result = gen[key](arg);
        var value = result.value;

        if (value instanceof AwaitValue) {
          Promise.resolve(value.value).then(function (arg) {
            resume("next", arg);
          }, function (arg) {
            resume("throw", arg);
          });
        } else {
          settle(result.done ? "return" : "normal", result.value);
        }
      } catch (err) {
        settle("throw", err);
      }
    }

    function settle(type, value) {
      switch (type) {
        case "return":
          front.resolve({
            value: value,
            done: true
          });
          break;

        case "throw":
          front.reject(value);
          break;

        default:
          front.resolve({
            value: value,
            done: false
          });
          break;
      }

      front = front.next;

      if (front) {
        resume(front.key, front.arg);
      } else {
        back = null;
      }
    }

    this._invoke = send;

    if (typeof gen.return !== "function") {
      this.return = undefined;
    }
  }

  if (typeof Symbol === "function" && Symbol.asyncIterator) {
    AsyncGenerator.prototype[Symbol.asyncIterator] = function () {
      return this;
    };
  }

  AsyncGenerator.prototype.next = function (arg) {
    return this._invoke("next", arg);
  };

  AsyncGenerator.prototype.throw = function (arg) {
    return this._invoke("throw", arg);
  };

  AsyncGenerator.prototype.return = function (arg) {
    return this._invoke("return", arg);
  };

  return {
    wrap: function (fn) {
      return function () {
        return new AsyncGenerator(fn.apply(this, arguments));
      };
    },
    await: function (value) {
      return new AwaitValue(value);
    }
  };
}();





var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();









var inherits = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
};











var possibleConstructorReturn = function (self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return call && (typeof call === "object" || typeof call === "function") ? call : self;
};

var Notifier = function () {
	function Notifier() {
		classCallCheck(this, Notifier);
	}

	createClass(Notifier, [{
		key: 'setSelector',
		value: function setSelector(selector) {
			console.log('setSelector', arguments);
		}
	}, {
		key: 'clear',
		value: function clear() {
			console.log('clear', arguments);
		}
	}, {
		key: 'resetStatus',
		value: function resetStatus() {
			console.log('status', arguments);
		}
	}, {
		key: 'resetStatusQuick',
		value: function resetStatusQuick() {
			console.log('status', arguments);
		}
	}, {
		key: 'setSuccess',
		value: function setSuccess(status, timeToShow) {
			console.log('success', arguments);
		}
	}, {
		key: 'setInfo',
		value: function setInfo(status, timeToShow) {
			console.log('info', arguments);
		}
	}, {
		key: 'setError',
		value: function setError(error) {
			console.log('error', arguments);
		}
	}]);
	return Notifier;
}();

var BimServerModel = function () {
	function BimServerModel(apiModel) {
		classCallCheck(this, BimServerModel);

		this.apiModel = apiModel;
		this.tree = null;
		this.treePromise = null;
	}

	createClass(BimServerModel, [{
		key: "getTree",
		value: function getTree(args) {

			/* 
   // TODO: This is rather tricky. Never know when the list of Projects is exhausted.
   // Luckily a valid IFC contains one and only one. Let's assume there is just one.
   const projectEncountered = false;
   
   this.model.getAllOfType("IfcProject", false, function(project) {
   	if (projectEncountered) {
   		throw new Error("More than a single project encountered, bleh!");
   	}
   	console.log('project', project);
   });
   
   */

			var self = this;

			return self.treePromise || (self.treePromise = new Promise(function (resolve, reject) {

				if (self.tree) {
					resolve(self.tree);
				}

				var entities = {
					'IfcRelDecomposes': 1,
					'IfcRelAggregates': 1,
					'IfcRelContainedInSpatialStructure': 1,
					'IfcRelFillsElement': 1,
					'IfcRelVoidsElement': 1
				};

				// Create a mapping from id->instance
				var instance_by_id = {};
				var objects = [];

				for (var e in self.apiModel.objects) {
					// The root node in a dojo store should have its parent
					// set to null, not just something that evaluates to false
					var o = self.apiModel.objects[e].object;
					o.parent = null;
					instance_by_id[o._i] = o;
					objects.push(o);
				}

				// Filter all instances based on relationship entities
				var relationships = objects.filter(function (o) {
					return entities[o._t];
				});

				// Construct a tuple of {parent, child} ids
				var parents = relationships.map(function (o) {
					var ks = Object.keys(o);
					var related = ks.filter(function (k) {
						return k.indexOf('Related') !== -1;
					});
					var relating = ks.filter(function (k) {
						return k.indexOf('Relating') !== -1;
					});
					return [o[relating[0]], o[related[0]]];
				});

				var is_array = function is_array(o) {
					return Object.prototype.toString.call(o) === '[object Array]';
				};

				var data = [];
				var visited = {};
				parents.forEach(function (a) {
					// Relationships in IFC can be one to one/many
					var ps = is_array(a[0]) ? a[0] : [a[0]];
					var cs = is_array(a[1]) ? a[1] : [a[1]];
					for (var i = 0; i < ps.length; ++i) {
						for (var j = 0; j < cs.length; ++j) {
							// Lookup the instance ids in the mapping
							var p = instance_by_id[ps[i]._i];
							var c = instance_by_id[cs[j]._i];

							// parent, id, hasChildren are significant attributes in a dojo store
							c.parent = p.id = p._i;
							c.id = c._i;
							p.hasChildren = true;

							// Make sure to only add instances once
							if (!visited[c.id]) {
								data.push(c);
							}
							if (!visited[p.id]) {
								data.push(p);
							}
							visited[p.id] = visited[c.id] = true;
						}
					}
				});

				var make_element = function make_element(o) {
					return { name: o.Name, id: o.id, guid: o.GlobalId, parent: o.parent, gid: o._rgeometry == null ? null : o._rgeometry /*._i*/ };
				};

				var fold = function () {
					var root = null;
					return function (li) {
						var by_oid = {};
						li.forEach(function (elem) {
							by_oid[elem.id] = elem;
						});
						li.forEach(function (elem) {
							if (elem.parent === null) {
								root = elem;
							} else {
								var p = by_oid[elem.parent];
								(p.children || (p.children = [])).push(elem);
							}
						});
						return root;
					};
				}();

				resolve(self.tree = fold(data.map(make_element)));
				//				});
			}));
		}
	}]);
	return BimServerModel;
}();

var PreloadQuery = {
	defines: {
		Representation: {
			type: "IfcProduct",
			fields: ["Representation", "geometry"]
		},
		ContainsElementsDefine: {
			type: "IfcSpatialStructureElement",
			field: "ContainsElements",
			include: {
				type: "IfcRelContainedInSpatialStructure",
				field: "RelatedElements",
				includes: ["IsDecomposedByDefine", "ContainsElementsDefine", "Representation"]
			}
		},
		IsDecomposedByDefine: {
			type: "IfcObjectDefinition",
			field: "IsDecomposedBy",
			include: {
				type: "IfcRelDecomposes",
				field: "RelatedObjects",
				includes: ["IsDecomposedByDefine", "ContainsElementsDefine", "Representation"]
			}
		}
	},
	queries: [{
		type: "IfcProject",
		includes: ["IsDecomposedByDefine", "ContainsElementsDefine"]
	}, {
		type: "IfcRepresentation",
		includeAllSubtypes: true
	}, {
		type: "IfcProductRepresentation"
	}, {
		type: "IfcPresentationLayerWithStyle"
	}, {
		type: "IfcProduct",
		includeAllSubtypes: true
	}, {
		type: "IfcProductDefinitionShape"
	}, {
		type: "IfcPresentationLayerAssignment"
	}, {
		type: "IfcRelAssociatesClassification",
		includes: [{
			type: "IfcRelAssociatesClassification",
			field: "RelatedObjects"
		}, {
			type: "IfcRelAssociatesClassification",
			field: "RelatingClassification"
		}]
	}, {
		type: "IfcSIUnit"
	}, {
		type: "IfcPresentationLayerAssignment"
	}]
};

/*\
|*|
|*|	:: Number.isInteger() polyfill ::
|*|
|*|	https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isInteger
|*|
\*/

if (!Number.isInteger) {
	Number.isInteger = function isInteger(nVal) {
		return typeof nVal === "number" && isFinite(nVal) && nVal > -9007199254740992 && nVal < 9007199254740992 && Math.floor(nVal) === nVal;
	};
}

/*\
|*|
|*|	StringView - Mozilla Developer Network
|*|
|*|	Revision #12, March 21st, 2017
|*|
|*|	https://developer.mozilla.org/en-US/Add-ons/Code_snippets/StringView
|*|	https://developer.mozilla.org/en-US/docs/User:fusionchess
|*|	https://github.com/madmurphy/stringview.js
|*|
|*|	This framework is released under the GNU Lesser General Public License, version 3 or later.
|*|	http://www.gnu.org/licenses/lgpl-3.0.html
|*|
\*/

var StringView = function () {
	function StringView(vInput, sEncoding /* optional (default: UTF-8) */, nOffset /* optional */, nLength /* optional */) {
		classCallCheck(this, StringView);

		var fTAView = void 0,
		    aWhole = void 0,
		    aRaw = void 0,
		    fPutOutptCode = void 0,
		    fGetOutptChrSize = void 0,
		    nInptLen = void 0,
		    nTranscrType = 15,
		    nStartIdx = isFinite(nOffset) ? nOffset : 0;

		if (sEncoding) {
			this.encoding = sEncoding.toString();
		} else {
			this.encoding = "UTF-8";
		}

		encSwitch: switch (this.encoding) {
			case "UTF-8":
				fPutOutptCode = this.putUTF8CharCode;
				fGetOutptChrSize = this.getUTF8CharLength;
				fTAView = Uint8Array;
				break encSwitch;
			case "UTF-16":
				fPutOutptCode = this.putUTF16CharCode;
				fGetOutptChrSize = this.getUTF16CharLength;
				fTAView = Uint16Array;
				break encSwitch;
			case "UTF-32":
				fTAView = Uint32Array;
				nTranscrType &= 14;
				break encSwitch;
			default:
				/* case "ASCII", or case "BinaryString" or unknown cases */
				fTAView = Uint8Array;
				nTranscrType &= 14;
		}

		typeSwitch: switch (typeof vInput === "undefined" ? "undefined" : _typeof(vInput)) {
			case "string":
				/* the input argument is a primitive string: a new buffer will be created. */
				nTranscrType &= 7;
				break typeSwitch;
			case "object":
				classSwitch: switch (vInput.constructor) {
					case StringView:
						/* the input argument is a stringView: a new buffer will be created. */
						nTranscrType &= 3;
						break typeSwitch;
					case String:
						/* the input argument is an objectified string: a new buffer will be created. */
						nTranscrType &= 7;
						break typeSwitch;
					case ArrayBuffer:
						/* the input argument is an arrayBuffer: the buffer will be shared. */
						aWhole = new fTAView(vInput);
						nInptLen = this.encoding === "UTF-32" ? vInput.byteLength >>> 2 : this.encoding === "UTF-16" ? vInput.byteLength >>> 1 : vInput.byteLength;
						aRaw = nStartIdx === 0 && (!isFinite(nLength) || nLength === nInptLen) ? aWhole : new fTAView(vInput, nStartIdx, !isFinite(nLength) ? nInptLen - nStartIdx : nLength);

						break typeSwitch;
					case Uint32Array:
					case Uint16Array:
					case Uint8Array:
						/* the input argument is a typedArray: the buffer, and possibly the array itself, will be shared. */
						fTAView = vInput.constructor;
						nInptLen = vInput.length;
						aWhole = vInput.byteOffset === 0 && vInput.length === (fTAView === Uint32Array ? vInput.buffer.byteLength >>> 2 : fTAView === Uint16Array ? vInput.buffer.byteLength >>> 1 : vInput.buffer.byteLength) ? vInput : new fTAView(vInput.buffer);
						aRaw = nStartIdx === 0 && (!isFinite(nLength) || nLength === nInptLen) ? vInput : vInput.subarray(nStartIdx, isFinite(nLength) ? nStartIdx + nLength : nInptLen);

						break typeSwitch;
					default:
						/* the input argument is an array or another serializable object: a new typedArray will be created. */
						aWhole = new fTAView(vInput);
						nInptLen = aWhole.length;
						aRaw = nStartIdx === 0 && (!isFinite(nLength) || nLength === nInptLen) ? aWhole : aWhole.subarray(nStartIdx, isFinite(nLength) ? nStartIdx + nLength : nInptLen);
				}
				break typeSwitch;
			default:
				/* the input argument is a number, a boolean or a function: a new typedArray will be created. */
				aWhole = aRaw = new fTAView(Number(vInput) || 0);

		}

		if (nTranscrType < 8) {

			var vSource = void 0,
			    nOutptLen = void 0,
			    nCharStart = void 0,
			    nCharEnd = void 0,
			    nEndIdx = void 0,
			    fGetInptChrSize = void 0,
			    fGetInptChrCode = void 0;

			if (nTranscrType & 4) {
				/* input is string */

				vSource = vInput;
				nOutptLen = nInptLen = vSource.length;
				nTranscrType ^= this.encoding === "UTF-32" ? 0 : 2;
				/* ...or...: nTranscrType ^= Number(this.encoding !== "UTF-32") << 1; */
				nStartIdx = nCharStart = nOffset ? Math.max((nOutptLen + nOffset) % nOutptLen, 0) : 0;
				nEndIdx = nCharEnd = (Number.isInteger(nLength) ? Math.min(Math.max(nLength, 0) + nStartIdx, nOutptLen) : nOutptLen) - 1;
			} else {
				/* input is stringView */

				vSource = vInput.rawData;
				nInptLen = vInput.makeIndex();
				nStartIdx = nCharStart = nOffset ? Math.max((nInptLen + nOffset) % nInptLen, 0) : 0;
				nOutptLen = Number.isInteger(nLength) ? Math.min(Math.max(nLength, 0), nInptLen - nCharStart) : nInptLen;
				nEndIdx = nCharEnd = nOutptLen + nCharStart;

				if (vInput.encoding === "UTF-8") {
					fGetInptChrSize = StringView.getUTF8CharLength;
					fGetInptChrCode = StringView.loadUTF8CharCode;
				} else if (vInput.encoding === "UTF-16") {
					fGetInptChrSize = StringView.getUTF16CharLength;
					fGetInptChrCode = StringView.loadUTF16CharCode;
				} else {
					nTranscrType &= 1;
				}
			}

			if (nOutptLen === 0 || nTranscrType < 4 && vSource.encoding === this.encoding && nCharStart === 0 && nOutptLen === nInptLen) {

				/* the encoding is the same, the length too and the offset is 0... or the input is empty! */

				nTranscrType = 7;
			}

			conversionSwitch: switch (nTranscrType) {

				case 0:

					/* both the source and the new StringView have a fixed-length encoding... */

					aWhole = new fTAView(nOutptLen);
					for (var nOutptIdx = 0; nOutptIdx < nOutptLen; aWhole[nOutptIdx] = vSource[nStartIdx + nOutptIdx++]) {}
					break conversionSwitch;

				case 1:

					/* the source has a fixed-length encoding but the new StringView has a variable-length encoding... */

					/* mapping... */

					nOutptLen = 0;

					for (var nInptIdx = nStartIdx; nInptIdx < nEndIdx; nInptIdx++) {
						nOutptLen += fGetOutptChrSize(vSource[nInptIdx]);
					}

					aWhole = new fTAView(nOutptLen);

					/* transcription of the source... */

					for (var _nInptIdx = nStartIdx, _nOutptIdx = 0; _nOutptIdx < nOutptLen; _nInptIdx++) {
						_nOutptIdx = fPutOutptCode(aWhole, vSource[_nInptIdx], _nOutptIdx);
					}

					break conversionSwitch;

				case 2:

					/* the source has a variable-length encoding but the new StringView has a fixed-length encoding... */

					/* mapping... */

					nStartIdx = 0;

					var nChrCode = void 0;

					for (var nChrIdx = 0; nChrIdx < nCharStart; nChrIdx++) {
						nChrCode = fGetInptChrCode(vSource, nStartIdx);
						nStartIdx += fGetInptChrSize(nChrCode);
					}

					aWhole = new fTAView(nOutptLen);

					/* transcription of the source... */

					for (var _nInptIdx2 = nStartIdx, _nOutptIdx2 = 0; _nOutptIdx2 < nOutptLen; _nInptIdx2 += fGetInptChrSize(nChrCode), _nOutptIdx2++) {
						nChrCode = fGetInptChrCode(vSource, _nInptIdx2);
						aWhole[_nOutptIdx2] = nChrCode;
					}

					break conversionSwitch;

				case 3:

					/* both the source and the new StringView have a variable-length encoding... */

					/* mapping... */

					nOutptLen = 0;

					for (var _nChrIdx = 0, _nInptIdx3 = 0; _nChrIdx < nCharEnd; _nInptIdx3 += fGetInptChrSize(nChrCode)) {
						nChrCode = fGetInptChrCode(vSource, _nInptIdx3);
						if (_nChrIdx === nCharStart) {
							nStartIdx = _nInptIdx3;
						}
						if (++_nChrIdx > nCharStart) {
							nOutptLen += fGetOutptChrSize(nChrCode);
						}
					}

					aWhole = new fTAView(nOutptLen);

					/* transcription... */

					for (var _nInptIdx4 = nStartIdx, _nOutptIdx3 = 0; _nOutptIdx3 < nOutptLen; _nInptIdx4 += fGetInptChrSize(nChrCode)) {
						nChrCode = fGetInptChrCode(vSource, _nInptIdx4);
						_nOutptIdx3 = fPutOutptCode(aWhole, nChrCode, _nOutptIdx3);
					}

					break conversionSwitch;

				case 4:

					/* DOMString to ASCII or BinaryString or other unknown encodings */

					aWhole = new fTAView(nOutptLen);

					/* transcription... */

					for (var nIdx = 0; nIdx < nOutptLen; nIdx++) {
						aWhole[nIdx] = vSource.charCodeAt(nIdx) & 0xff;
					}

					break conversionSwitch;

				case 5:

					/* DOMString to UTF-8 or to UTF-16 */

					/* mapping... */

					nOutptLen = 0;

					for (var nMapIdx = 0; nMapIdx < nInptLen; nMapIdx++) {
						if (nMapIdx === nCharStart) {
							nStartIdx = nOutptLen;
						}
						nOutptLen += fGetOutptChrSize(vSource.charCodeAt(nMapIdx));
						if (nMapIdx === nCharEnd) {
							nEndIdx = nOutptLen;
						}
					}

					aWhole = new fTAView(nOutptLen);

					/* transcription... */

					for (var _nOutptIdx4 = 0, _nChrIdx2 = 0; _nOutptIdx4 < nOutptLen; _nChrIdx2++) {
						_nOutptIdx4 = fPutOutptCode(aWhole, vSource.charCodeAt(_nChrIdx2), _nOutptIdx4);
					}

					break conversionSwitch;

				case 6:

					/* DOMString to UTF-32 */

					aWhole = new fTAView(nOutptLen);

					/* transcription... */

					for (var _nIdx = 0; _nIdx < nOutptLen; _nIdx++) {
						aWhole[_nIdx] = vSource.charCodeAt(_nIdx);
					}

					break conversionSwitch;

				case 7:

					aWhole = new fTAView(nOutptLen ? vSource : 0);
					break conversionSwitch;

			}

			aRaw = nTranscrType > 3 && (nStartIdx > 0 || nEndIdx < aWhole.length - 1) ? aWhole.subarray(nStartIdx, nEndIdx) : aWhole;
		}

		this.buffer = aWhole.buffer;
		this.bufferView = aWhole;
		this.rawData = aRaw;

		Object.freeze(this);
	}

	createClass(StringView, [{
		key: "makeIndex",


		/* INSTANCES' METHODS */

		value: function makeIndex(nChrLength, nStartFrom) {

			var aTarget = this.rawData,
			    nChrEnd = void 0,
			    nRawLength = aTarget.length,
			    nStartIdx = nStartFrom || 0,
			    nIdxEnd = nStartIdx,
			    nStopAtChr = isNaN(nChrLength) ? Infinity : nChrLength;

			if (nChrLength + 1 > aTarget.length) {
				throw new RangeError("prototype.makeIndex - The offset can\'t be major than the length of the array - 1.");
			}

			switch (this.encoding) {

				case "UTF-8":

					var nPart = void 0;

					for (nChrEnd = 0; nIdxEnd < nRawLength && nChrEnd < nStopAtChr; nChrEnd++) {
						nPart = aTarget[nIdxEnd];
						nIdxEnd += nPart > 251 && nPart < 254 && nIdxEnd + 5 < nRawLength ? 6 : nPart > 247 && nPart < 252 && nIdxEnd + 4 < nRawLength ? 5 : nPart > 239 && nPart < 248 && nIdxEnd + 3 < nRawLength ? 4 : nPart > 223 && nPart < 240 && nIdxEnd + 2 < nRawLength ? 3 : nPart > 191 && nPart < 224 && nIdxEnd + 1 < nRawLength ? 2 : 1;
					}

					break;

				case "UTF-16":

					for (nChrEnd = nStartIdx; nIdxEnd < nRawLength && nChrEnd < nStopAtChr; nChrEnd++) {
						nIdxEnd += aTarget[nIdxEnd] > 0xD7BF /* 55231 */ && nIdxEnd + 1 < aTarget.length ? 2 : 1;
					}

					break;

				default:

					nIdxEnd = nChrEnd = isFinite(nChrLength) ? nChrLength : nRawLength - 1;

			}

			if (nChrLength) {
				return nIdxEnd;
			}

			return nChrEnd;
		}
	}, {
		key: "toBase64",
		value: function toBase64(bWholeBuffer) {

			return this.bytesToBase64(bWholeBuffer ? this.bufferView.constructor === Uint8Array ? this.bufferView : new Uint8Array(this.buffer) : this.rawData.constructor === Uint8Array ? this.rawData : new Uint8Array(this.buffer, this.rawData.byteOffset, this.rawData.length << (this.rawData.constructor === Uint16Array ? 1 : 2)));
		}
	}, {
		key: "subview",
		value: function subview(nCharOffset /* optional */, nCharLength /* optional */) {

			var nRawSubLen = void 0,
			    nRawSubOffset = void 0,
			    nSubOffset = void 0,
			    nSubLen = void 0,
			    bVariableLen = this.encoding === "UTF-8" || this.encoding === "UTF-16",
			    nThisLen = void 0,
			    nRawLen = this.rawData.length;

			if (nRawLen === 0) {
				return new StringView(this.buffer, this.encoding);
			}

			nThisLen = bVariableLen ? this.makeIndex() : nRawLen;
			nSubOffset = nCharOffset ? nCharOffset + 1 > nThisLen ? nThisLen : Math.max((nThisLen + nCharOffset) % nThisLen, 0) : 0;
			nSubLen = Number.isInteger(nCharLength) ? Math.max(nCharLength, 0) + nSubOffset > nThisLen ? nThisLen - nSubOffset : nCharLength : nThisLen - nSubOffset;

			if (nSubOffset === 0 && nSubLen === nThisLen) {
				return this;
			}

			if (bVariableLen) {
				nRawSubOffset = nSubOffset < nThisLen ? this.makeIndex(nSubOffset) : nThisLen;
				nRawSubLen = nSubLen ? this.makeIndex(nSubLen, nRawSubOffset) - nRawSubOffset : 0;
			} else {
				nRawSubOffset = nSubOffset;
				nRawSubLen = nSubLen;
			}

			if (this.encoding === "UTF-16") {
				nRawSubOffset <<= 1;
			} else if (this.encoding === "UTF-32") {
				nRawSubOffset <<= 2;
			}

			return new StringView(this.buffer, this.encoding, this.rawData.byteOffset + nRawSubOffset, nRawSubLen);
		}
	}, {
		key: "forEachChar",
		value: function forEachChar(fCallback, oThat, nChrOffset, nChrLen) {

			var aSource = this.rawData,
			    nRawEnd = void 0,
			    nRawIdx = void 0;

			if (this.encoding === "UTF-8" || this.encoding === "UTF-16") {

				var fGetInptChrSize = void 0,
				    fGetInptChrCode = void 0;

				if (this.encoding === "UTF-8") {
					fGetInptChrSize = StringView.getUTF8CharLength;
					fGetInptChrCode = StringView.loadUTF8CharCode;
				} else if (this.encoding === "UTF-16") {
					fGetInptChrSize = StringView.getUTF16CharLength;
					fGetInptChrCode = StringView.loadUTF16CharCode;
				}

				nRawIdx = isFinite(nChrOffset) ? this.makeIndex(nChrOffset) : 0;
				nRawEnd = isFinite(nChrLen) ? this.makeIndex(nChrLen, nRawIdx) : aSource.length;

				for (var nChrCode, nChrIdx = 0; nRawIdx < nRawEnd; nChrIdx++) {
					nChrCode = fGetInptChrCode(aSource, nRawIdx);
					if (!oThat) {
						fCallback(nChrCode, nChrIdx, nRawIdx, aSource);
					} else {
						fCallback.call(oThat, nChrCode, nChrIdx, nRawIdx, aSource);
					}
					nRawIdx += fGetInptChrSize(nChrCode);
				}
			} else {

				nRawIdx = isFinite(nChrOffset) ? nChrOffset : 0;
				nRawEnd = isFinite(nChrLen) ? nChrLen + nRawIdx : aSource.length;

				for (nRawIdx; nRawIdx < nRawEnd; nRawIdx++) {
					if (!oThat) {
						fCallback(aSource[nRawIdx], nRawIdx, nRawIdx, aSource);
					} else {
						fCallback.call(oThat, aSource[nRawIdx], nRawIdx, nRawIdx, aSource);
					}
				}
			}
		}
	}, {
		key: "valueOf",
		value: function valueOf() {

			if (this.encoding !== "UTF-8" && this.encoding !== "UTF-16") {
				/* ASCII, UTF-32 or BinaryString to DOMString */
				return String.fromCharCode.apply(null, this.rawData);
			}

			var fGetCode = void 0,
			    fGetIncr = void 0,
			    sView = "";

			if (this.encoding === "UTF-8") {
				fGetIncr = StringView.getUTF8CharLength;
				fGetCode = StringView.loadUTF8CharCode;
			} else if (this.encoding === "UTF-16") {
				fGetIncr = StringView.getUTF16CharLength;
				fGetCode = StringView.loadUTF16CharCode;
			}

			for (var nChr, nLen = this.rawData.length, nIdx = 0; nIdx < nLen; nIdx += fGetIncr(nChr)) {
				nChr = fGetCode(this.rawData, nIdx);
				sView += String.fromCharCode(nChr);
			}

			return sView;
		}
	}, {
		key: "toString",
		value: function toString() {
			return this.valueOf();
		}
	}], [{
		key: "loadUTF8CharCode",
		value: function loadUTF8CharCode(aChars, nIdx) {
			/* The ISO 10646 view of UTF-8 considers valid codepoints encoded by 1-6 bytes, 
    * while the Unicode view of UTF-8 in 2003 has limited them to 1-4 bytes in order to 
    * match UTF-16's codepoints. In front of a 5/6-byte sequence StringView tries to 
    * encode it in any case.
    */
			var nLen = aChars.length,
			    nPart = aChars[nIdx];
			return nPart > 251 && nPart < 254 && nIdx + 5 < nLen ?
			/* (nPart - 252 << 30) may be not safe in ECMAScript! So...: */
			/* six bytes */
			(nPart - 252) * 1073741824 + (aChars[nIdx + 1] - 128 << 24) + (aChars[nIdx + 2] - 128 << 18) + (aChars[nIdx + 3] - 128 << 12) + (aChars[nIdx + 4] - 128 << 6) + aChars[nIdx + 5] - 128 : nPart > 247 && nPart < 252 && nIdx + 4 < nLen ?
			/* five bytes */
			(nPart - 248 << 24) + (aChars[nIdx + 1] - 128 << 18) + (aChars[nIdx + 2] - 128 << 12) + (aChars[nIdx + 3] - 128 << 6) + aChars[nIdx + 4] - 128 : nPart > 239 && nPart < 248 && nIdx + 3 < nLen ?
			/* four bytes */
			(nPart - 240 << 18) + (aChars[nIdx + 1] - 128 << 12) + (aChars[nIdx + 2] - 128 << 6) + aChars[nIdx + 3] - 128 : nPart > 223 && nPart < 240 && nIdx + 2 < nLen ?
			/* three bytes */
			(nPart - 224 << 12) + (aChars[nIdx + 1] - 128 << 6) + aChars[nIdx + 2] - 128 : nPart > 191 && nPart < 224 && nIdx + 1 < nLen ?
			/* two bytes */
			(nPart - 192 << 6) + aChars[nIdx + 1] - 128 :
			/* one byte */
			nPart;
		}
	}, {
		key: "putUTF8CharCode",
		value: function putUTF8CharCode(aTarget, nChar, nPutAt) {

			var nIdx = nPutAt;

			if (nChar < 0x80 /* 128 */) {
					/* one byte */
					aTarget[nIdx++] = nChar;
				} else if (nChar < 0x800 /* 2048 */) {
					/* two bytes */
					aTarget[nIdx++] = 0xc0 /* 192 */ + (nChar >>> 6);
					aTarget[nIdx++] = 0x80 /* 128 */ + (nChar & 0x3f /* 63 */);
				} else if (nChar < 0x10000 /* 65536 */) {
					/* three bytes */
					aTarget[nIdx++] = 0xe0 /* 224 */ + (nChar >>> 12);
					aTarget[nIdx++] = 0x80 /* 128 */ + (nChar >>> 6 & 0x3f /* 63 */);
					aTarget[nIdx++] = 0x80 /* 128 */ + (nChar & 0x3f /* 63 */);
				} else if (nChar < 0x200000 /* 2097152 */) {
					/* four bytes */
					aTarget[nIdx++] = 0xf0 /* 240 */ + (nChar >>> 18);
					aTarget[nIdx++] = 0x80 /* 128 */ + (nChar >>> 12 & 0x3f /* 63 */);
					aTarget[nIdx++] = 0x80 /* 128 */ + (nChar >>> 6 & 0x3f /* 63 */);
					aTarget[nIdx++] = 0x80 /* 128 */ + (nChar & 0x3f /* 63 */);
				} else if (nChar < 0x4000000 /* 67108864 */) {
					/* five bytes */
					aTarget[nIdx++] = 0xf8 /* 248 */ + (nChar >>> 24);
					aTarget[nIdx++] = 0x80 /* 128 */ + (nChar >>> 18 & 0x3f /* 63 */);
					aTarget[nIdx++] = 0x80 /* 128 */ + (nChar >>> 12 & 0x3f /* 63 */);
					aTarget[nIdx++] = 0x80 /* 128 */ + (nChar >>> 6 & 0x3f /* 63 */);
					aTarget[nIdx++] = 0x80 /* 128 */ + (nChar & 0x3f /* 63 */);
				} else /* if (nChar <= 0x7fffffff) */{
					/* 2147483647 */
					/* six bytes */
					aTarget[nIdx++] = 0xfc /* 252 */ + /* (nChar >>> 30) may be not safe in ECMAScript! So...: */nChar / 1073741824;
					aTarget[nIdx++] = 0x80 /* 128 */ + (nChar >>> 24 & 0x3f /* 63 */);
					aTarget[nIdx++] = 0x80 /* 128 */ + (nChar >>> 18 & 0x3f /* 63 */);
					aTarget[nIdx++] = 0x80 /* 128 */ + (nChar >>> 12 & 0x3f /* 63 */);
					aTarget[nIdx++] = 0x80 /* 128 */ + (nChar >>> 6 & 0x3f /* 63 */);
					aTarget[nIdx++] = 0x80 /* 128 */ + (nChar & 0x3f /* 63 */);
				}

			return nIdx;
		}
	}, {
		key: "getUTF8CharLength",
		value: function getUTF8CharLength(nChar) {
			return nChar < 0x80 ? 1 : nChar < 0x800 ? 2 : nChar < 0x10000 ? 3 : nChar < 0x200000 ? 4 : nChar < 0x4000000 ? 5 : 6;
		}
	}, {
		key: "loadUTF16CharCode",
		value: function loadUTF16CharCode(aChars, nIdx) {

			/* UTF-16 to DOMString decoding algorithm */
			var nFrstChr = aChars[nIdx];

			return nFrstChr > 0xD7BF /* 55231 */ && nIdx + 1 < aChars.length ? (nFrstChr - 0xD800 /* 55296 */ << 10) + aChars[nIdx + 1] + 0x2400 /* 9216 */ : nFrstChr;
		}
	}, {
		key: "putUTF16CharCode",
		value: function putUTF16CharCode(aTarget, nChar, nPutAt) {

			var nIdx = nPutAt;

			if (nChar < 0x10000 /* 65536 */) {
					/* one element */
					aTarget[nIdx++] = nChar;
				} else {
				/* two elements */
				aTarget[nIdx++] = 0xD7C0 /* 55232 */ + (nChar >>> 10);
				aTarget[nIdx++] = 0xDC00 /* 56320 */ + (nChar & 0x3FF /* 1023 */);
			}

			return nIdx;
		}
	}, {
		key: "getUTF16CharLength",
		value: function getUTF16CharLength(nChar) {
			return nChar < 0x10000 ? 1 : 2;
		}

		/* Array of bytes to base64 string decoding */

	}, {
		key: "b64ToUint6",
		value: function b64ToUint6(nChr) {

			return nChr > 64 && nChr < 91 ? nChr - 65 : nChr > 96 && nChr < 123 ? nChr - 71 : nChr > 47 && nChr < 58 ? nChr + 4 : nChr === 43 ? 62 : nChr === 47 ? 63 : 0;
		}
	}, {
		key: "uint6ToB64",
		value: function uint6ToB64(nUint6) {

			return nUint6 < 26 ? nUint6 + 65 : nUint6 < 52 ? nUint6 + 71 : nUint6 < 62 ? nUint6 - 4 : nUint6 === 62 ? 43 : nUint6 === 63 ? 47 : 65;
		}

		/* Base64 string to array encoding */

	}, {
		key: "bytesToBase64",
		value: function bytesToBase64(aBytes) {

			var eqLen = (3 - aBytes.length % 3) % 3;
			var sB64Enc = "";

			for (var nMod3, nLen = aBytes.length, nUint24 = 0, nIdx = 0; nIdx < nLen; nIdx++) {
				nMod3 = nIdx % 3;
				/* Uncomment the following line in order to split the output in lines 76-character long: */
				/*
    if (nIdx > 0 && (nIdx * 4 / 3) % 76 === 0) { sB64Enc += "\r\n"; }
    */
				nUint24 |= aBytes[nIdx] << (16 >>> nMod3 & 24);
				if (nMod3 === 2 || aBytes.length - nIdx === 1) {
					sB64Enc += String.fromCharCode(this.uint6ToB64(nUint24 >>> 18 & 63), this.uint6ToB64(nUint24 >>> 12 & 63), this.uint6ToB64(nUint24 >>> 6 & 63), this.uint6ToB64(nUint24 & 63));
					nUint24 = 0;
				}
			}

			return eqLen === 0 ? sB64Enc : sB64Enc.substring(0, sB64Enc.length - eqLen) + (eqLen === 1 ? "=" : "==");
		}
	}, {
		key: "base64ToBytes",
		value: function base64ToBytes(sBase64, nBlockBytes) {

			var sB64Enc = sBase64.replace(/[^A-Za-z0-9\+\/]/g, ""),
			    nInLen = sB64Enc.length,
			    nOutLen = nBlockBytes ? Math.ceil((nInLen * 3 + 1 >>> 2) / nBlockBytes) * nBlockBytes : nInLen * 3 + 1 >>> 2,
			    aBytes = new Uint8Array(nOutLen);

			for (var nMod3, nMod4, nUint24 = 0, nOutIdx = 0, nInIdx = 0; nInIdx < nInLen; nInIdx++) {
				nMod4 = nInIdx & 3;
				nUint24 |= this.b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << 18 - 6 * nMod4;
				if (nMod4 === 3 || nInLen - nInIdx === 1) {
					for (nMod3 = 0; nMod3 < 3 && nOutIdx < nOutLen; nMod3++, nOutIdx++) {
						aBytes[nOutIdx] = nUint24 >>> (16 >>> nMod3 & 24) & 255;
					}
					nUint24 = 0;
				}
			}

			return aBytes;
		}
	}, {
		key: "makeFromBase64",
		value: function makeFromBase64(sB64Inpt, sEncoding, nByteOffset, nLength) {

			return new StringView(sEncoding === "UTF-16" || sEncoding === "UTF-32" ? this.base64ToBytes(sB64Inpt, sEncoding === "UTF-16" ? 2 : 4).buffer : this.base64ToBytes(sB64Inpt), sEncoding, nByteOffset, nLength);
		}
	}]);
	return StringView;
}();

var DataInputStreamReader = function () {
	function DataInputStreamReader(arrayBuffer) {
		classCallCheck(this, DataInputStreamReader);


		this.arrayBuffer = arrayBuffer;
		this.dataView = new DataView(this.arrayBuffer);
		this.pos = 0;
	}

	createClass(DataInputStreamReader, [{
		key: 'readUTF8',
		value: function readUTF8() {
			var length = this.dataView.getInt16(this.pos);
			this.pos += 2;
			var view = this.arrayBuffer.slice(this.pos, this.pos + length);
			var result = new StringView(view).toString();
			this.pos += length;
			return result;
		}
	}, {
		key: 'align4',
		value: function align4() {
			// Skips to the next alignment of 4 (source should have done the same!)
			var skip = 4 - this.pos % 4;
			if (skip > 0 && skip != 4) {
				//			console.log("Skip", skip);
				this.pos += skip;
			}
		}
	}, {
		key: 'align8',
		value: function align8() {
			// Skips to the next alignment of 4 (source should have done the same!)
			var skip = 8 - this.pos % 8;
			if (skip > 0 && skip != 8) {
				//			console.log("Skip", skip);
				this.pos += skip;
			}
		}
	}, {
		key: 'readDoubleArray',
		value: function readDoubleArray(length) {
			var result = new Float64Array(this.arrayBuffer, this.pos, length);
			this.pos += length * 8;
			return result;
		}
	}, {
		key: 'readFloat',
		value: function readFloat() {
			var value = this.dataView.getFloat32(this.pos, true);
			this.pos += 4;
			return value;
		}
	}, {
		key: 'readInt',
		value: function readInt() {
			var value = this.dataView.getInt32(this.pos, true);
			this.pos += 4;
			return value;
		}
	}, {
		key: 'readByte',
		value: function readByte() {
			var value = this.dataView.getInt8(this.pos);
			this.pos += 1;
			return value;
		}
	}, {
		key: 'readLong',
		value: function readLong() {
			var value = this.dataView.getUint32(this.pos, true) + 0x100000000 * this.dataView.getUint32(this.pos + 4, true);
			this.pos += 8;
			return value;
		}
	}, {
		key: 'readFloatArray2',
		value: function readFloatArray2(length) {
			var results = [];
			for (var i = 0; i < length; i++) {
				var value = this.dataView.getFloat32(this.pos, true);
				this.pos += 4;
				results.push(value);
			}
			return results;
		}
	}, {
		key: 'readFloatArray',
		value: function readFloatArray(length) {
			var result = new Float32Array(this.arrayBuffer, this.pos, length);
			this.pos += length * 4;
			return result;
		}
	}, {
		key: 'readIntArray2',
		value: function readIntArray2(length) {
			var results = [];
			for (var i = 0; i < length; i++) {
				var value = this.dataView.getInt32(this.pos, true);
				this.pos += 4;
				results.push(value);
			}
			return results;
		}
	}, {
		key: 'readIntArray',
		value: function readIntArray(length) {
			var result = new Int32Array(this.arrayBuffer, this.pos, length);
			this.pos += length * 4;
			return result;
		}
	}, {
		key: 'readShortArray',
		value: function readShortArray(length) {
			try {
				var result = new Int16Array(this.arrayBuffer, this.pos, length);
				this.pos += length * 2;
				return result;
			} catch (e) {
				console.log(e);
			}
		}
	}]);
	return DataInputStreamReader;
}();

var BimServerGeometryLoader = function () {
	function BimServerGeometryLoader(bimServerApi, viewer, model, roid, globalTransformationMatrix) {
		classCallCheck(this, BimServerGeometryLoader);

		this.bimServerApi = bimServerApi;
		this.viewer = viewer;
		this.state = {};
		this.progressListeners = [];
		this.objectAddedListeners = [];
		this.prepareReceived = false;
		this.todo = [];
		this.geometryIds = {};
		this.dataToInfo = {};
		this.globalTransformationMatrix = globalTransformationMatrix;
		this.model = model;
		this.roid = roid;

		console.log(globalTransformationMatrix);
	}

	createClass(BimServerGeometryLoader, [{
		key: "addProgressListener",
		value: function addProgressListener(progressListener) {
			this.progressListeners.push(progressListener);
		}
	}, {
		key: "process",
		value: function process() {
			var data = this.todo.shift();
			var stream = void 0;

			while (data != null) {
				stream = new DataInputStreamReader(data);

				var channel = stream.readLong();
				var messageType = stream.readByte();

				if (messageType == 0) {
					this._readStart(stream);
				} else if (messageType == 6) {
					this._readEnd(stream);
				} else {
					this._readObject(stream, messageType);
				}

				data = this.todo.shift();
			}
		}
	}, {
		key: "setLoadOids",
		value: function setLoadOids(oids) {
			this.options = {
				type: "oids",
				oids: oids
			};
		}

		/**
   * Starts this loader.
   */

	}, {
		key: "start",
		value: function start() {
			var _this = this;

			if (!this.options || this.options.type !== "oids") {
				throw new Error("Invalid loader configuration");
			}

			var obj = [];

			this.groupId = this.roid;
			this.infoToOid = this.options.oids;

			for (var k in this.infoToOid) {
				var oid = parseInt(this.infoToOid[k]);
				this.model.apiModel.get(oid, function (object) {
					if (object.object._rgeometry != null) {
						if (object.model.objects[object.object._rgeometry] != null) {
							// Only if this data is preloaded, otherwise just don't include any gi
							object.getGeometry(function (geometryInfo) {
								obj.push({
									gid: object.object._rgeometry,
									oid: object.oid,
									object: object,
									info: geometryInfo.object
								});
							});
						} else {
							obj.push({
								gid: object.object._rgeometry,
								oid: object.oid,
								object: object
							});
						}
					}
				});
			}

			obj.sort(function (a, b) {
				if (a.info != null && b.info != null) {
					var topa = (a.info._emaxBounds.z + a.info._eminBounds.z) / 2;
					var topb = (b.info._emaxBounds.z + b.info._eminBounds.z) / 2;
					return topa - topb;
				} else {
					// Resort back to type
					// TODO this is dodgy when some objects do have info, and others don't
					return a.object.getType().localeCompare(b.object.getType());
				}
			});

			var oids = [];
			obj.forEach(function (wrapper) {
				oids.push(wrapper.object.object._rgeometry /*._i*/);
			});

			var query = {
				type: "GeometryInfo",
				oids: oids,
				include: {
					type: "GeometryInfo",
					field: "data"
				}
			};

			this.bimServerApi.getSerializerByPluginClassName("org.bimserver.serializers.binarygeometry.BinaryGeometryMessagingStreamingSerializerPlugin3", function (serializer) {
				_this.bimServerApi.call("ServiceInterface", "download", {
					roids: [_this.roid],
					query: JSON.stringify(query),
					serializerOid: serializer.oid,
					sync: false
				}, function (topicId) {
					_this.topicId = topicId;
					_this.bimServerApi.registerProgressHandler(_this.topicId, _this._progressHandler.bind(_this));
				});
			});
		}
	}, {
		key: "_progressHandler",
		value: function _progressHandler(topicId, state) {
			if (topicId == this.topicId) {
				if (state.title == "Done preparing") {
					if (!this.prepareReceived) {
						this.prepareReceived = true;
						this._downloadInitiated();
					}
				}
				if (state.state == "FINISHED") {
					this.bimServerApi.unregisterProgressHandler(this.topicId, this._progressHandler.bind(this));
				}
			}
		}
	}, {
		key: "_downloadInitiated",
		value: function _downloadInitiated() {
			this.state = {
				mode: 0,
				nrObjectsRead: 0,
				nrObjects: 0
			};
			// this.viewer.SYSTEM.events.trigger('progressStarted', ['Loading Geometry']);
			// this.viewer.SYSTEM.events.trigger('progressBarStyleChanged', BIMSURFER.Constants.ProgressBarStyle.Continuous);
			var msg = {
				longActionId: this.topicId,
				topicId: this.topicId
			};
			this.bimServerApi.setBinaryDataListener(this.topicId, this._binaryDataListener.bind(this));
			this.bimServerApi.downloadViaWebsocket(msg);
		}
	}, {
		key: "_binaryDataListener",
		value: function _binaryDataListener(data) {
			this.todo.push(data);
		}
	}, {
		key: "_afterRegistration",
		value: function _afterRegistration(topicId) {
			var _this2 = this;

			this.bimServerApi.call("Bimsie1NotificationRegistryInterface", "getProgress", {
				topicId: this.topicId
			}, function (state) {
				_this2._progressHandler(_this2.topicId, state);
			});
		}
	}, {
		key: "_readEnd",
		value: function _readEnd(data) {
			var _this3 = this;

			this.progressListeners.forEach(function (progressListener) {
				progressListener("done", _this3.state.nrObjectsRead, _this3.state.nrObjectsRead);
			});
			this.bimServerApi.call("ServiceInterface", "cleanupLongAction", {
				topicId: this.topicId
			}, function () {});
		}
	}, {
		key: "_readStart",
		value: function _readStart(data) {
			var _this4 = this;

			var start = data.readUTF8();

			if (start != "BGS") {
				console.error("data does not start with BGS (" + start + ")");
				return false;
			}

			this.protocolVersion = data.readByte();

			if (this.protocolVersion != 10 && this.protocolVersion != 11) {
				console.error("Unimplemented version");
				return false;
			}

			data.align8();

			var boundary = data.readDoubleArray(6);

			this._initCamera(boundary);

			this.state.mode = 1;

			this.progressListeners.forEach(function (progressListener) {
				progressListener("start", _this4.state.nrObjectsRead, _this4.state.nrObjectsRead);
			});
			//this._updateProgress();
		}
	}, {
		key: "_initCamera",
		value: function _initCamera(boundary) {

			if (!this._gotCamera) {

				this._gotCamera = true;

				// Bump scene origin to center the model

				var xmin = boundary[0];
				var ymin = boundary[1];
				var zmin = boundary[2];
				var xmax = boundary[3];
				var ymax = boundary[4];
				var zmax = boundary[5];

				var diagonal = Math.sqrt(Math.pow(xmax - xmin, 2) + Math.pow(ymax - ymin, 2) + Math.pow(zmax - zmin, 2));

				var scale = 100 / diagonal;

				this.viewer.setScale(scale); // Temporary until we find a better scaling system.

				var center = [scale * ((xmax + xmin) / 2), scale * ((ymax + ymin) / 2), scale * ((zmax + zmin) / 2)];

				this.viewer.setCamera({
					type: "persp",
					target: center,
					up: [0, 0, 1],
					eye: [center[0] - scale * diagonal, center[1] - scale * diagonal, center[2] + scale * diagonal],
					far: 5000,
					near: 0.1,
					fovy: 35.8493
				});
			}
		}
	}, {
		key: "_updateProgress",
		value: function _updateProgress() {
			//            if (this.state.nrObjectsRead < this.state.nrObjects) {
			//                const progress = Math.ceil(100 * this.state.nrObjectsRead / this.state.nrObjects);
			//                if (progress != this.state.lastProgress) {
			//                    this.progressListeners.forEach(function (progressListener) {
			//                        progressListener(progress, this.state.nrObjectsRead, this.state.nrObjects);
			//                    });
			//                    // TODO: Add events
			//                    // this.viewer.SYSTEM.events.trigger('progressChanged', [progress]);
			//                    this.state.lastProgress = progress;
			//                }
			//            } else {
			//                // this.viewer.SYSTEM.events.trigger('progressDone');
			//                this.progressListeners.forEach(function (progressListener) {
			//                    progressListener("done", this.state.nrObjectsRead, this.state.nrObjects);
			//                });
			//                // this.viewer.events.trigger('sceneLoaded', [this.viewer.scene.scene]);
			//
			//                const d = {};
			//                d[BIMSERVER_VERSION == "1.4" ? "actionId" : "topicId"] = this.topicId;
			//                this.bimServerApi.call("ServiceInterface", "cleanupLongAction", d, function () {});
			//            }
		}
	}, {
		key: "_readObject",
		value: function _readObject(stream, geometryType) {
			var _this5 = this;

			stream.align8();

			//            const type = stream.readUTF8();
			//            const roid = stream.readLong(); // TODO: Needed?
			//            const objectId = stream.readLong();
			//            const oid = objectId;

			var geometryId = void 0;
			var numParts = void 0;
			var numIndices = void 0;
			var indices = void 0;
			var numPositions = void 0;
			var positions = void 0;
			var numNormals = void 0;
			var normals = void 0;
			var numColors = void 0;
			var colors = null;
			var color = void 0;

			var i = void 0;

			if (geometryType == 1) {
				geometryId = stream.readLong();
				numIndices = stream.readInt();
				indices = stream.readShortArray(numIndices);

				if (this.protocolVersion == 11) {
					var b = stream.readInt();
					if (b == 1) {
						color = {
							r: stream.readFloat(),
							g: stream.readFloat(),
							b: stream.readFloat(),
							a: stream.readFloat()
						};
					}
				}
				stream.align4();
				numPositions = stream.readInt();
				positions = stream.readFloatArray(numPositions);
				numNormals = stream.readInt();
				normals = stream.readFloatArray(numNormals);
				numColors = stream.readInt();
				if (numColors > 0) {
					colors = stream.readFloatArray(numColors);
				} else if (color != null) {
					// Creating vertex colors here anyways (not transmitted over the line is a plus), should find a way to do this with scenejs without vertex-colors
					colors = new Array(numPositions * 4);
					for (var _i = 0; _i < numPositions; _i++) {
						colors[_i * 4 + 0] = color.r;
						colors[_i * 4 + 1] = color.g;
						colors[_i * 4 + 2] = color.b;
						colors[_i * 4 + 3] = color.a;
					}
				}

				this.geometryIds[geometryId] = [geometryId];
				this.viewer.createGeometry(geometryId, positions, normals, colors, indices);

				if (this.dataToInfo[geometryId] != null) {
					this.dataToInfo[geometryId].forEach(function (oid) {
						var ob = _this5.viewer.getObject(_this5.roid + ":" + oid);
						ob.add(geometryId);
					});
					delete this.dataToInfo[geometryId];
				}
			} else if (geometryType == 2) {
				console.log("Unimplemented", 2);
			} else if (geometryType == 3) {
				var geometryDataOid = stream.readLong();
				numParts = stream.readInt();
				this.geometryIds[geometryDataOid] = [];

				var geometryIds = [];
				for (i = 0; i < numParts; i++) {
					var partId = stream.readLong();
					geometryId = geometryDataOid + "_" + i;
					numIndices = stream.readInt();
					indices = stream.readShortArray(numIndices);

					if (this.protocolVersion == 11) {
						var _b = stream.readInt();
						if (_b == 1) {
							var _color = {
								r: stream.readFloat(),
								g: stream.readFloat(),
								b: stream.readFloat(),
								a: stream.readFloat()
							};
						}
					}
					stream.align4();

					numPositions = stream.readInt();
					positions = stream.readFloatArray(numPositions);
					numNormals = stream.readInt();
					normals = stream.readFloatArray(numNormals);
					numColors = stream.readInt();
					if (numColors > 0) {
						colors = stream.readFloatArray(numColors);
					} else if (color != null) {
						// Creating vertex colors here anyways (not transmitted over the line is a plus), should find a way to do this with scenejs without vertex-colors
						colors = new Array(numPositions * 4);
						for (var _i2 = 0; _i2 < numPositions; _i2++) {
							colors[_i2 * 4 + 0] = color.r;
							colors[_i2 * 4 + 1] = color.g;
							colors[_i2 * 4 + 2] = color.b;
							colors[_i2 * 4 + 3] = color.a;
						}
					}

					geometryIds.push(geometryId);
					this.geometryIds[geometryDataOid].push(geometryId);
					this.viewer.createGeometry(geometryId, positions, normals, colors, indices);
				}
				if (this.dataToInfo[geometryDataOid] != null) {
					this.dataToInfo[geometryDataOid].forEach(function (oid) {
						var ob = _this5.viewer.getObject(_this5.roid + ":" + oid);
						geometryIds.forEach(function (geometryId) {
							ob.add(geometryId);
						});
					});
					delete this.dataToInfo[geometryDataOid];
				}
			} else if (geometryType == 4) {
				console.log("Unimplemented", 4);
			} else if (geometryType == 5) {
				var roid = stream.readLong();
				var geometryInfoOid = stream.readLong();
				var _objectBounds = stream.readDoubleArray(6);
				var matrix = stream.readDoubleArray(16);
				if (this.globalTransformationMatrix != null) {
					xeogl.math.mulMat4(matrix, matrix, this.globalTransformationMatrix);
				}
				var _geometryDataOid = stream.readLong();
				var geometryDataOids = this.geometryIds[_geometryDataOid];
				var oid = this.infoToOid[geometryInfoOid];
				if (geometryDataOids == null) {
					geometryDataOids = [];
					var list = this.dataToInfo[_geometryDataOid];
					if (list == null) {
						list = [];
						this.dataToInfo[_geometryDataOid] = list;
					}
					list.push(oid);
				}
				if (oid == null) {
					console.error("Not found", this.infoToOid, geometryInfoOid);
				} else {
					this.model.apiModel.get(oid, function (object) {
						object.gid = geometryInfoOid;
						var modelId = _this5.roid; // TODO: set to the model ID
						_this5._createObject(modelId, roid, oid, oid, geometryDataOids, object.getType(), matrix);
					});
				}
			} else {
				this.warn("Unsupported geometry type: " + geometryType);
				return;
			}

			this.state.nrObjectsRead++;

			this._updateProgress();
		}
	}, {
		key: "_createObject",
		value: function _createObject(modelId, roid, oid, objectId, geometryIds, type, matrix) {

			if (this.state.mode == 0) {
				console.log("Mode is still 0, should be 1");
				return;
			}

			// this.models[roid].get(oid,
			// function () {
			if (this.viewer.createObject(modelId, roid, oid, objectId, geometryIds, type, matrix)) {}

			// this.objectAddedListeners.forEach(function (listener) {
			// listener(objectId);
			// });


			// });
		}
	}]);
	return BimServerGeometryLoader;
}();

var EventHandler = function () {
	function EventHandler() {
		classCallCheck(this, EventHandler);

		this.handlers = {};
	}

	createClass(EventHandler, [{
		key: "on",
		value: function on(evt, handler) {
			(this.handlers[evt] || (this.handlers[evt] = [])).push(handler);
		}
	}, {
		key: "off",
		value: function off(evt, handler) {
			var h = this.handlers[evt];
			var found = false;
			if (typeof h !== 'undefined') {
				var i = h.indexOf(handler);
				if (i >= -1) {
					h.splice(i, 1);
					found = true;
				}
			}
			if (!found) {
				throw new Error("Handler not found");
			}
		}
	}, {
		key: "fire",
		value: function fire(evt, args) {
			var h = this.handlers[evt];
			if (!h) {
				return;
			}
			for (var i = 0; i < h.length; ++i) {
				h[i].apply(this, args);
			}
		}
	}]);
	return EventHandler;
}();

var DefaultMaterials = {
	IfcSpace: [0.137255, 0.403922, 0.870588, 0.5],
	IfcRoof: [0.837255, 0.203922, 0.270588, 1.0],
	IfcSlab: [0.637255, 0.603922, 0.670588, 1.0],
	IfcWall: [0.537255, 0.337255, 0.237255, 1.0],
	IfcWallStandardCase: [0.537255, 0.337255, 0.237255, 1.0],
	IfcDoor: [0.637255, 0.603922, 0.670588, 1.0],
	IfcWindow: [0.137255, 0.403922, 0.870588, 0.5],
	IfcOpeningElement: [0.137255, 0.403922, 0.870588, 0],
	IfcRailing: [0.137255, 0.403922, 0.870588, 1.0],
	IfcColumn: [0.137255, 0.403922, 0.870588, 1.0],
	IfcBeam: [0.137255, 0.403922, 0.870588, 1.0],
	IfcFurnishingElement: [0.137255, 0.403922, 0.870588, 1.0],
	IfcCurtainWall: [0.137255, 0.403922, 0.870588, 1.0],
	IfcStair: [0.637255, 0.603922, 0.670588, 1.0],
	IfcStairFlight: [0.637255, 0.603922, 0.670588, 1.0],
	IfcBuildingElementProxy: [0.5, 0.5, 0.5, 1.0],
	IfcFlowSegment: [0.137255, 0.403922, 0.870588, 1.0],
	IfcFlowitting: [0.137255, 0.403922, 0.870588, 1.0],
	IfcFlowTerminal: [0.137255, 0.403922, 0.870588, 1.0],
	IfcProxy: [0.137255, 0.403922, 0.870588, 1.0],
	IfcSite: [0.137255, 0.403922, 0.870588, 1.0],
	IfcLightFixture: [0.8470588235, 0.8470588235, 0.870588, 1.0],
	IfcDuctSegment: [0.8470588235, 0.427450980392, 0, 1.0],
	IfcDistributionFlowElement: [0.8470588235, 0.427450980392, 0, 1.0],
	IfcDuctFitting: [0.8470588235, 0.427450980392, 0, 1.0],
	IfcPlate: [0.8470588235, 0.427450980392, 0, 0.5],
	IfcAirTerminal: [0.8470588235, 0.427450980392, 0, 1.0],
	IfcMember: [0.8470588235, 0.427450980392, 0, 1.0],
	IfcCovering: [0.8470588235, 0.427450980392, 0, 1.0],
	IfcTransportElement: [0.8470588235, 0.427450980392, 0, 1.0],
	IfcFlowController: [0.8470588235, 0.427450980392, 0, 1.0],
	IfcFlowFitting: [0.8470588235, 0.427450980392, 0, 1.0],
	IfcRamp: [0.8470588235, 0.427450980392, 0, 1.0],
	IfcFurniture: [0.8470588235, 0.427450980392, 0, 1.0],
	IfcFooting: [0.8470588235, 0.427450980392, 0, 1.0],
	IfcSystemFurnitureElement: [0.8470588235, 0.427450980392, 0, 1.0],
	//IfcSpace: [ 0.137255, 0.303922,  0.570588,  0.5],
	DEFAULT: [0.5, 0.5, 0.5, 1.0]
};

var xmlToJson = function xmlToJson(node, attributeRenamer) {
	if (node.nodeType === node.TEXT_NODE) {
		var v = node.nodeValue;
		if (v.match(/^\s+$/) === null) {
			return v;
		}
	} else if (node.nodeType === node.ELEMENT_NODE || node.nodeType === node.DOCUMENT_NODE) {
		var json = {
			type: node.nodeName,
			children: []
		};

		if (node.nodeType === node.ELEMENT_NODE) {
			for (var j = 0; j < node.attributes.length; j++) {
				var attribute = node.attributes[j];
				var nm = attributeRenamer[attribute.nodeName] || attribute.nodeName;
				json[nm] = attribute.nodeValue;
			}
		}

		for (var i = 0; i < node.childNodes.length; i++) {
			var item = node.childNodes[i];
			var _j = xmlToJson(item, attributeRenamer);
			if (_j) {
				json.children.push(_j);
			}
		}

		return json;
	}
};

var clone = function clone(ob) {
	return JSON.parse(JSON.stringify(ob));
};

var guidChars = [["0", 10], ["A", 26], ["a", 26], ["_", 1], ["$", 1]].map(function (a) {
	var li = [];
	var st = a[0].charCodeAt(0);
	var en = st + a[1];
	for (var i = st; i < en; ++i) {
		li.push(i);
	}
	return String.fromCharCode.apply(null, li);
}).join("");

var b64 = function b64(v, len) {
	var r = !len || len == 4 ? [0, 6, 12, 18] : [0, 6];
	return r.map(function (i) {
		return guidChars.substr(parseInt(v / (1 << i)) % 64, 1);
	}).reverse().join("");
};

var compressGuid = function compressGuid(g) {
	var bs = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30].map(function (i) {
		return parseInt(g.substr(i, 2), 16);
	});
	return b64(bs[0], 2) + [1, 4, 7, 10, 13].map(function (i) {
		return b64((bs[i] << 16) + (bs[i + 1] << 8) + bs[i + 2]);
	}).join("");
};

var findNodeOfType = function findNodeOfType(m, t) {
	var li = [];
	var _ = function _(n) {
		if (n.type === t) {
			li.push(n);
		}
		(n.children || []).forEach(function (c) {
			_(c);
		});
	};

	_(m);
	return li;
};

var timeout = function timeout(dt) {
	return new Promise(function (resolve, reject) {
		setTimeout(resolve, dt);
	});
};

var Utils = {
	'XmlToJson': xmlToJson,
	'Clone': clone,
	'CompressGuid': compressGuid,
	'FindNodeOfType': findNodeOfType,
	'Delay': timeout
};

/**
   Controls camera with mouse and keyboard, handles selection of entities and rotation point.
   */
xeogl.BIMCameraControl = xeogl.Component.extend({

    type: "xeogl.BIMCameraControl",

    _init: function _init(cfg) {

        var self = this;

        var math = xeogl.math;

        // Configs

        var sensitivityKeyboardRotate = cfg.sensitivityKeyboardRotate || 0.5;

        var orthoScaleRate = 0.02; // Rate at which orthographic scale changes with zoom

        var canvasPickTolerance = 4;
        var worldPickTolerance = 3;

        var pitchMat = math.mat4();

        var camera = cfg.camera;
        var view = camera.view;
        var project = camera.project;
        var scene = this.scene;
        var input = scene.input;

        // Camera position on last mouse click
        var rotateStartEye;
        var rotateStartLook;
        var rotateStartUp = math.vec3();

        var orbitPitchAxis = math.vec3([1, 0, 0]); // The current axis for vertical orbit  

        var pickHit; // Hit record from the most recent pick
        var pickClicks = 0; // Number of times we've clicked on same spot on entity

        var mouseClickPos = math.vec2(); // Canvas position of last mouseDown
        var firstPickCanvasPos = math.vec2(); // Canvas position of first pick
        var firstPickWorldPos = math.vec2(); // World position of first pick
        var firstPickTime; // Time of first pick

        var rotatePos = this._rotatePos = math.vec3([0, 0, 0]); // World-space pivot point we're currently rotating about

        var lastCanvasPos = math.vec2(); // Mouse's position in previous tick
        var rotationDeltas = math.vec2(); // Accumulated angle deltas while rotating with keyboard or mouse

        var shiftDown = false; // True while shift key down
        var mouseDown = false; // true while mouse down

        var flying = false;

        var lastHoverDistance = null;

        this._defaultDragAction = "orbit";

        // Returns the inverse of the camera's current view transform matrix
        var getInverseViewMat = function () {
            var viewMatDirty = true;
            camera.on("viewMatrix", function () {
                viewMatDirty = true;
            });
            var inverseViewMat = math.mat4();
            return function () {
                if (viewMatDirty) {
                    math.inverseMat4(view.matrix, inverseViewMat);
                }
                return inverseViewMat;
            };
        }();

        // Returns the inverse of the camera's current projection transform matrix
        var getInverseProjectMat = function () {
            var projMatDirty = true;
            camera.on("projectMatrix", function () {
                projMatDirty = true;
            });
            var inverseProjectMat = math.mat4();
            return function () {
                if (projMatDirty) {
                    math.inverseMat4(project.matrix, inverseProjectMat);
                }
                return inverseProjectMat;
            };
        }();

        // Returns the transposed copy the camera's current projection transform matrix
        var getTransposedProjectMat = function () {
            var projMatDirty = true;
            camera.on("projectMatrix", function () {
                projMatDirty = true;
            });
            var transposedProjectMat = math.mat4();
            return function () {
                if (projMatDirty) {
                    math.transposeMat4(project.matrix, transposedProjectMat);
                }
                return transposedProjectMat;
            };
        }();

        // Get the current diagonal size of the scene
        var getSceneDiagSize = function () {
            var sceneSizeDirty = true;
            var diag = 1; // Just in case
            scene.worldBoundary.on("updated", function () {
                sceneSizeDirty = true;
            });
            return function () {
                if (sceneSizeDirty) {
                    diag = math.getAABB3Diag(scene.worldBoundary.aabb);
                }
                return diag;
            };
        }();

        var rotate = function () {
            var tempVec3a = math.vec3();
            var tempVec3b = math.vec3();
            var tempVec3c = math.vec3();
            return function (p) {
                var p1 = math.subVec3(p, rotatePos, tempVec3a);
                var p2 = math.transformVec3(pitchMat, p1, tempVec3b);
                var p3 = math.addVec3(p2, rotatePos, tempVec3c);
                return math.rotateVec3Z(p3, rotatePos, -rotationDeltas[0] * math.DEGTORAD, math.vec3());
            };
        }();

        // Rotation point indicator

        var pickHelper = this.create({
            type: "xeogl.Entity",
            geometry: this.create({
                type: "xeogl.SphereGeometry",
                radius: 1.0
            }),
            material: this.create({
                type: "xeogl.PhongMaterial",
                diffuse: [0, 0, 0],
                ambient: [0, 0, 0],
                specular: [0, 0, 0],
                emissive: [1.0, 1.0, 0.6], // Glowing
                lineWidth: 4
            }),
            transform: this.create({
                type: "xeogl.Translate",
                xyz: [0, 0, 0]
            }),
            visibility: this.create({
                type: "xeogl.Visibility",
                visible: false // Initially invisible
            }),
            modes: this.create({
                type: "xeogl.Modes",
                collidable: false // This helper has no collision boundary of its own
            })
        });

        // Shows the rotation point indicator
        // at the given position for one second

        var showRotationPoint = function () {

            var pickHelperHide = null;

            return function (pos) {

                pickHelper.transform.xyz = pos;
                pickHelper.visibility.visible = true;

                if (pickHelperHide) {
                    clearTimeout(pickHelperHide);
                    pickHelperHide = null;
                }

                pickHelperHide = setTimeout(function () {
                    pickHelper.visibility.visible = false;
                    pickHelperHide = null;
                }, 1000);
            };
        }();

        var pickTimer;

        // Fires a "pick" after a timeout period unless clearPickTimer is called before then.
        function startPickTimer() {

            if (pickTimer) {
                clearPickTimer();
            }

            pickTimer = setTimeout(function () {
                pickClicks = 0;
                self.fire("pick", pickHit);
                pickTimer = null;
            }, 250);
        }

        // Stops a previous call to startPickTimer from firing a "pick"
        function clearPickTimer() {
            clearTimeout(pickTimer);
            pickTimer = null;
        }

        function resetRotate() {

            pickClicks = 0;

            rotationDeltas[0] = 0;
            rotationDeltas[1] = 0;

            rotateStartEye = view.eye.slice();
            rotateStartLook = view.look.slice();
            math.addVec3(rotateStartEye, view.up, rotateStartUp);

            setOrbitPitchAxis();
        }

        function setOrbitPitchAxis() {
            math.cross3Vec3(math.normalizeVec3(math.subVec3(view.eye, view.look, math.vec3())), view.up, orbitPitchAxis);
        }

        var setCursor = function () {

            var t;

            return function (cursor, persist) {

                clearTimeout(t);

                self.scene.canvas.overlay.style["cursor"] = cursor;

                if (!persist) {
                    t = setTimeout(function () {
                        self.scene.canvas.overlay.style["cursor"] = "auto";
                    }, 100);
                }
            };
        }();

        input.on("mousedown", function (canvasPos) {

            canvasPos = canvasPos.slice();

            if (!input.mouseover) {
                return;
            }

            if (!input.mouseDownLeft) {
                return;
            }

            if (flying) {
                return;
            }

            clearPickTimer();

            setOrbitPitchAxis();

            rotateStartEye = view.eye.slice();
            rotateStartLook = view.look.slice();
            math.addVec3(rotateStartEye, view.up, rotateStartUp);

            pickHit = scene.pick({
                canvasPos: canvasPos,
                pickSurface: true
            });

            if (pickHit && pickHit.worldPos) {

                var pickWorldPos = pickHit.worldPos.slice();
                var pickCanvasPos = canvasPos;

                var pickTime = Date.now();

                if (pickClicks === 1) {

                    if (pickTime - firstPickTime < 250 && closeEnoughCanvas(canvasPos, firstPickCanvasPos) && closeEnoughWorld(pickWorldPos, firstPickWorldPos)) {

                        // Double-clicked

                        rotatePos.set(pickWorldPos);

                        showRotationPoint(pickWorldPos);
                    }

                    pickClicks = 0;
                } else {

                    pickClicks = 1;

                    firstPickWorldPos = pickWorldPos;
                    firstPickCanvasPos = pickCanvasPos;
                    firstPickTime = pickTime;
                }
            } else {

                pickClicks = 0;
            }

            mouseClickPos[0] = canvasPos[0];
            mouseClickPos[1] = canvasPos[1];

            rotationDeltas[0] = 0;
            rotationDeltas[1] = 0;

            mouseDown = true;
        });

        // Returns true if the two Canvas-space points are
        // close enough to be considered the same point

        function closeEnoughCanvas(p, q) {
            return p[0] >= q[0] - canvasPickTolerance && p[0] <= q[0] + canvasPickTolerance && p[1] >= q[1] - canvasPickTolerance && p[1] <= q[1] + canvasPickTolerance;
        }

        // Returns true if the two World-space points are
        // close enough to be considered the same point

        function closeEnoughWorld(p, q) {
            return p[0] >= q[0] - worldPickTolerance && p[0] <= q[0] + worldPickTolerance && p[1] >= q[1] - worldPickTolerance && p[1] >= q[1] - worldPickTolerance && p[2] <= q[2] + worldPickTolerance && p[2] <= q[2] + worldPickTolerance;
        }

        var tempVecHover = math.vec3();

        var updateHoverDistanceAndCursor = function updateHoverDistanceAndCursor(canvasPos) {
            var hit = scene.pick({
                canvasPos: canvasPos || lastCanvasPos,
                pickSurface: true
            });

            if (hit) {
                setCursor("pointer", true);
                if (hit.worldPos) {
                    // TODO: This should be somehow hit.viewPos.z, but doesn't seem to be
                    lastHoverDistance = math.lenVec3(math.subVec3(hit.worldPos, view.eye, tempVecHover));
                }
            } else {
                setCursor("auto", true);
            }
        };

        input.on("mousemove", function (canvasPos) {

            if (!input.mouseover) {
                return;
            }

            if (flying) {
                return;
            }

            if (!mouseDown) {

                updateHoverDistanceAndCursor(canvasPos);

                lastCanvasPos[0] = canvasPos[0];
                lastCanvasPos[1] = canvasPos[1];

                return;
            }

            var sceneSize = getSceneDiagSize();

            // Use normalized device coords
            var canvas = scene.canvas.canvas;
            var cw2 = canvas.offsetWidth / 2.;
            var ch2 = canvas.offsetHeight / 2.;

            var inverseProjMat = getInverseProjectMat();
            var inverseViewMat = getInverseViewMat();

            // Get last two columns of projection matrix
            var transposedProjectMat = getTransposedProjectMat();
            var Pt3 = transposedProjectMat.subarray(8, 12);
            var Pt4 = transposedProjectMat.subarray(12);

            // TODO: Should be simpler to get the projected Z value
            var D = [0, 0, -(lastHoverDistance || sceneSize), 1];
            var Z = math.dotVec4(D, Pt3) / math.dotVec4(D, Pt4);

            // Returns in camera space and model space as array of two points
            var unproject = function unproject(p) {
                var cp = math.vec4();
                cp[0] = (p[0] - cw2) / cw2;
                cp[1] = (p[1] - ch2) / ch2;
                cp[2] = Z;
                cp[3] = 1.;
                cp = math.vec4(math.mulMat4v4(inverseProjMat, cp));

                // Normalize homogeneous coord
                math.mulVec3Scalar(cp, 1.0 / cp[3]);
                cp[3] = 1.0;

                // TODO: Why is this reversed?
                cp[0] *= -1;

                var cp2 = math.vec4(math.mulMat4v4(inverseViewMat, cp));
                return [cp, cp2];
            };

            var A = unproject(canvasPos);
            var B = unproject(lastCanvasPos);

            var panning = self._defaultDragAction === "pan";

            if (input.keyDown[input.KEY_SHIFT] || input.mouseDownMiddle || input.mouseDownLeft && input.mouseDownRight) {
                panning = !panning;
            }

            if (panning) {
                // TODO: view.pan is in view space? We have a world coord vector.

                // Subtract model space unproject points
                math.subVec3(A[1], B[1], tempVecHover);
                view.eye = math.addVec3(view.eye, tempVecHover);
                view.look = math.addVec3(view.look, tempVecHover);
            } else {
                // If not panning, we are orbiting                        

                // Subtract camera space unproject points
                math.subVec3(A[0], B[0], tempVecHover);

                //           v because reversed above
                var xDelta = -tempVecHover[0] * Math.PI;
                var yDelta = tempVecHover[1] * Math.PI;

                rotationDeltas[0] += xDelta;
                rotationDeltas[1] += yDelta;

                math.rotationMat4v(rotationDeltas[1] * math.DEGTORAD, orbitPitchAxis, pitchMat);

                view.eye = rotate(rotateStartEye);
                view.look = rotate(rotateStartLook);
                view.up = math.subVec3(rotate(rotateStartUp), view.eye, math.vec3());
            }

            lastCanvasPos[0] = canvasPos[0];
            lastCanvasPos[1] = canvasPos[1];
        });

        input.on("keydown", function (keyCode) {
            if (keyCode === input.KEY_SHIFT) {
                shiftDown = true;
            }
        });

        input.on("keyup", function (keyCode) {
            if (keyCode === input.KEY_SHIFT) {
                shiftDown = false;
                resetRotate();
            }
        });

        input.on("mouseup", function (canvasPos) {

            if (!mouseDown) {
                return;
            }

            if (flying) {
                return;
            }

            mouseDown = false;

            if (input.mouseover) {

                if (firstPickCanvasPos && closeEnoughCanvas(canvasPos, firstPickCanvasPos)) {

                    if (pickClicks === 1) {

                        if (shiftDown) {

                            pickClicks = 0;

                            self.fire("pick", pickHit);
                        } else {
                            startPickTimer();
                        }
                    } else {
                        //  self.fire("nopick");
                    }
                } else if (pickClicks === 0) {

                    if (mouseClickPos && closeEnoughCanvas(canvasPos, mouseClickPos)) {

                        self.fire("nopick");
                    }
                }
            }
        });

        input.on("dblclick", function () {

            if (flying) {
                return;
            }

            mouseDown = false;
        });

        //---------------------------------------------------------------------------------------------------------
        // Keyboard rotate camera
        //---------------------------------------------------------------------------------------------------------


        scene.on("tick", function (params) {

            if (!input.mouseover) {
                return;
            }

            if (mouseDown) {
                return;
            }

            if (flying) {
                return;
            }

            if (!input.ctrlDown && !input.altDown) {

                var left = input.keyDown[input.KEY_LEFT_ARROW];
                var right = input.keyDown[input.KEY_RIGHT_ARROW];
                var up = input.keyDown[input.KEY_UP_ARROW];
                var down = input.keyDown[input.KEY_DOWN_ARROW];

                if (left || right || up || down) {

                    var elapsed = params.deltaTime;
                    var yawRate = sensitivityKeyboardRotate * 0.3;
                    var pitchRate = sensitivityKeyboardRotate * 0.3;
                    var yaw = 0;
                    var pitch = 0;

                    if (right) {
                        yaw = -elapsed * yawRate;
                    } else if (left) {
                        yaw = elapsed * yawRate;
                    }

                    if (down) {
                        pitch = elapsed * pitchRate;
                    } else if (up) {
                        pitch = -elapsed * pitchRate;
                    }

                    if (Math.abs(yaw) > Math.abs(pitch)) {
                        pitch = 0;
                    } else {
                        yaw = 0;
                    }

                    rotationDeltas[0] -= yaw;
                    rotationDeltas[1] += pitch;

                    math.rotationMat4v(rotationDeltas[1] * math.DEGTORAD, orbitPitchAxis, pitchMat);

                    view.eye = rotate(rotateStartEye);
                    view.look = rotate(rotateStartLook);
                    view.up = math.subVec3(rotate(rotateStartUp), view.eye, math.vec3());
                }
            }
        });

        //---------------------------------------------------------------------------------------------------------
        // Keyboard zoom camera
        //---------------------------------------------------------------------------------------------------------

        (function () {

            var tempVec3a = math.vec3();
            var tempVec3b = math.vec3();
            var tempVec3c = math.vec3();
            var eyePivotVec = math.vec3();

            scene.on("tick", function (params) {

                if (!input.mouseover) {
                    return;
                }

                if (mouseDown) {
                    return;
                }

                if (flying) {
                    return;
                }

                var elapsed = params.deltaTime;

                if (!input.ctrlDown && !input.altDown) {

                    var wkey = input.keyDown[input.KEY_ADD];
                    var skey = input.keyDown[input.KEY_SUBTRACT];

                    if (wkey || skey) {

                        var sceneSize = getSceneDiagSize();
                        var rate = sceneSize / 5000.0;

                        var delta = 0;

                        if (skey) {
                            delta = elapsed * rate; // Want sensitivity configs in [0..1] range
                        } else if (wkey) {
                            delta = -elapsed * rate;
                        }

                        var eye = view.eye;
                        var look = view.look;

                        // Get vector from eye to center of rotation
                        math.mulVec3Scalar(math.normalizeVec3(math.subVec3(eye, rotatePos, tempVec3a), tempVec3b), delta, eyePivotVec);

                        // Move eye and look along the vector
                        view.eye = math.addVec3(eye, eyePivotVec, tempVec3c);
                        view.look = math.addVec3(look, eyePivotVec, tempVec3c);

                        if (project.isType("xeogl.Ortho")) {
                            project.scale += delta * orthoScaleRate;
                        }

                        resetRotate();
                    }
                }
            });
        })();

        //---------------------------------------------------------------------------------------------------------
        // Mouse zoom
        // Roll mouse wheel to move eye and look closer or further from center of rotationDeltas 
        //---------------------------------------------------------------------------------------------------------

        (function () {

            var delta = 0;
            var target = 0;
            var newTarget = false;
            var targeting = false;
            var progress = 0;

            var tempVec3a = math.vec3();
            var tempVec3b = math.vec3();
            var newEye = math.vec3();
            var newLook = math.vec3();
            var eyePivotVec = math.vec3();

            input.on("mousewheel", function (_delta) {

                if (mouseDown) {
                    return;
                }

                if (flying) {
                    return;
                }

                delta = -_delta;

                if (delta === 0) {
                    targeting = false;
                    newTarget = false;
                } else {
                    newTarget = true;
                }
            });

            var updateTimeout = null;

            scene.on("tick", function (e) {

                if (!targeting && !newTarget) {
                    return;
                }

                if (mouseDown) {
                    return;
                }

                if (flying) {
                    return;
                }

                if (updateTimeout) {
                    clearTimeout(updateTimeout);
                }
                updateTimeout = setTimeout(function () {
                    updateHoverDistanceAndCursor();
                    updateTimeout = null;
                }, 50);

                var zoomTimeInSeconds = 0.2;
                var viewDistance = getSceneDiagSize();
                if (lastHoverDistance) {
                    viewDistance = viewDistance * 0.02 + lastHoverDistance;
                }

                var tickDeltaSecs = e.deltaTime / 1000.0;
                var f = viewDistance * (delta < 0 ? -1 : 1) / zoomTimeInSeconds / 100.;

                if (newTarget) {

                    target = zoomTimeInSeconds;

                    progress = 0;
                    newTarget = false;
                    targeting = true;
                }

                if (targeting) {

                    progress += tickDeltaSecs;

                    if (progress > target) {
                        targeting = false;
                    }

                    if (targeting) {

                        var eye = view.eye;
                        var look = view.look;

                        math.mulVec3Scalar(xeogl.math.transposeMat4(view.matrix).slice(8), f, eyePivotVec);
                        math.addVec3(eye, eyePivotVec, newEye);
                        math.addVec3(look, eyePivotVec, newLook);

                        var lenEyePivotVec = Math.abs(math.lenVec3(eyePivotVec));
                        var currentEyePivotDist = Math.abs(math.lenVec3(math.subVec3(eye, rotatePos, math.vec3())));

                        // if (lenEyePivotVec < currentEyePivotDist - 10) {

                        // Move eye and look along the vector
                        view.eye = newEye;
                        view.look = newLook;

                        if (project.isType("xeogl.Ortho")) {
                            project.scale += delta * orthoScaleRate;
                        }
                        // }

                        resetRotate();
                    }
                }
            });
        })();

        //---------------------------------------------------------------------------------------------------------
        // Keyboard axis view
        // Press 1,2,3,4,5 or 6 to view center of model from along an axis 
        //---------------------------------------------------------------------------------------------------------

        (function () {

            var flight = self.create({
                type: "xeogl.CameraFlightAnimation",
                camera: camera,
                duration: 1.0 // One second to fly to each new target
            });

            function fly(eye, look, up) {

                rotatePos.set(look);

                flying = true;

                flight.cancel();

                flight.flyTo({
                    look: look,
                    eye: eye,
                    up: up
                }, function () {
                    resetRotate();

                    flying = false;
                });
            }

            input.on("keydown", function (keyCode) {

                if (!input.mouseover) {
                    return;
                }

                if (mouseDown) {
                    return;
                }

                if (keyCode !== input.KEY_NUM_1 && keyCode !== input.KEY_NUM_2 && keyCode !== input.KEY_NUM_3 && keyCode !== input.KEY_NUM_4 && keyCode !== input.KEY_NUM_5 && keyCode !== input.KEY_NUM_6) {
                    return;
                }

                var boundary = scene.worldBoundary;
                var aabb = boundary.aabb;
                var center = boundary.center;
                var diag = math.getAABB3Diag(aabb);
                var fitFOV = 55;
                var dist = Math.abs(diag / Math.tan(fitFOV / 2));

                switch (keyCode) {

                    case input.KEY_NUM_1:
                        // Right view
                        fly(math.vec3([center[0] - dist, center[1], center[2]]), center, math.vec3([0, 0, 1]));
                        break;

                    case input.KEY_NUM_2:
                        // Back view
                        fly(math.vec3([center[0], center[1] + dist, center[2]]), center, math.vec3([0, 0, 1]));
                        break;

                    case input.KEY_NUM_3:
                        // Left view
                        fly(math.vec3([center[0] + dist, center[1], center[2]]), center, math.vec3([0, 0, 1]));
                        break;

                    case input.KEY_NUM_4:
                        // Front view
                        fly(math.vec3([center[0], center[1] - dist, center[2]]), center, math.vec3([0, 0, 1]));
                        break;

                    case input.KEY_NUM_5:
                        // Top view
                        fly(math.vec3([center[0], center[1], center[2] + dist]), center, math.vec3([0, 1, 0]));
                        break;

                    case input.KEY_NUM_6:
                        // Bottom view
                        fly(math.vec3([center[0], center[1], center[2] - dist]), center, math.vec3([0, -1, 0]));
                        break;

                    default:
                        return;
                }
            });
        })();

        //---------------------------------------------------------------------------------------------------------
        // Keyboard pan camera
        // Press W,S,A or D to pan the camera 
        //---------------------------------------------------------------------------------------------------------

        scene.on("tick", function () {

            var tempVec3 = math.vec3();

            return function (params) {

                if (mouseDown) {
                    return;
                }

                if (!input.mouseover) {
                    return;
                }

                if (flying) {
                    return;
                }

                var elapsed = params.deltaTime;

                if (!input.ctrlDown && !input.altDown) {

                    var wkey = input.keyDown[input.KEY_W];
                    var skey = input.keyDown[input.KEY_S];
                    var akey = input.keyDown[input.KEY_A];
                    var dkey = input.keyDown[input.KEY_D];
                    var zkey = input.keyDown[input.KEY_Z];
                    var xkey = input.keyDown[input.KEY_X];

                    if (wkey || skey || akey || dkey || xkey || zkey) {

                        var x = 0;
                        var y = 0;
                        var z = 0;

                        var sceneSize = getSceneDiagSize();
                        var sensitivity = sceneSize / 4000.0;

                        if (skey) {
                            y = elapsed * sensitivity;
                        } else if (wkey) {
                            y = -elapsed * sensitivity;
                        }

                        if (dkey) {
                            x = elapsed * sensitivity;
                        } else if (akey) {
                            x = -elapsed * sensitivity;
                        }

                        if (xkey) {
                            z = elapsed * sensitivity;
                        } else if (zkey) {
                            z = -elapsed * sensitivity;
                        }

                        tempVec3[0] = x;
                        tempVec3[1] = y;
                        tempVec3[2] = z;

                        view.pan(tempVec3);

                        resetRotate();
                    }
                }
            };
        }());
    },

    _props: {

        // The position we're currently orbiting
        rotatePos: {

            set: function set(value) {

                if (value) {
                    this._rotatePos.set(value);
                }
            }
        },

        defaultDragAction: {
            set: function set(value) {
                if (value === "pan" || value === "orbit") {
                    this._defaultDragAction = value;
                }
            }
        }
    }
});

/**
 Custom xeoEngine component that represents a BIMSurfer model within a xeoEngine scene.
   @class BIMModel
 @module XEO
 @constructor
 @param [scene] {Scene} Parent {{#crossLink "Scene"}}{{/crossLink}}.
 @param [cfg] {*} Configs
 @param [cfg.id] {String} Optional ID, unique among all components in the parent scene, generated automatically when omitted.
 @param [cfg.meta] {String:Object} Optional map of user-defined metadata to attach to this xeogl.BIMModel.
 @extends Component
 */
xeogl.BIMModel = xeogl.Component.extend({

    // JavaScript class name for this xeogl.BIMModel.
    type: "xeogl.BIMModel",

    // Constructor
    _init: function _init(cfg) {
        this.collection = this.create({
            type: "xeogl.Collection" // http://xeoengine.org/docs/classes/Collection.html
        });
    },

    // Adds a BIMObject to this BIMModel
    addObject: function addObject(object) {
        this.collection.add(object);
    }
});

/**
 Custom xeoEngine component that represents a BIMSurfer object within a xeoEngine scene.
   An object consists of a set of xeogl.Entity's that share components between them.
   The components control functionality for the Entity's as a group, while the Entity's
 themselves each have their own xeogl.Geometry.
   This way, we are able to have BIM objects containing multiple geometries.
   @class BIMObject
 @module XEO
 @constructor
 @param [scene] {Scene} Parent {{#crossLink "Scene"}}{{/crossLink}}.
 @param [cfg] {*} Configs
 @param [cfg.id] {String} Optional ID, unique among all components in the parent scene, generated automatically when omitted.
 @param [cfg.meta] {String:Object} Optional map of user-defined metadata to attach to this xeogl.BIMObject.
 @extends Component
 */
xeogl.BIMObject = xeogl.Component.extend({

    /**
     JavaScript class name for this xeogl.BIMObject.
       @property type
     @type String
     @final
     */
    type: "xeogl.BIMObject",

    // Constructor

    _init: function _init(cfg) {

        // Model this object belongs to, will be null when no model
        this.model = cfg.model; // xeogl.BIMModel

        // Modelling transform component
        this.transform = this.create({
            type: "xeogl.Transform", // http://xeoengine.org/docs/classes/Transform.html
            matrix: cfg.matrix
        });

        // Visibility control component.
        this.visibility = this.create({
            type: "xeogl.Visibility", // http://xeoengine.org/docs/classes/Visibility.html
            visible: true
        });

        // Material component
        this.material = this.create({
            type: "xeogl.PhongMaterial", // http://xeoengine.org/docs/classes/Material.html
            emissive: [0, 0, 0],
            diffuse: [Math.random(), Math.random(), Math.random()], // Random color until we set for type
            opacity: 1.0
        });

        // Rendering modes component
        this.modes = this.create({
            type: "xeogl.Modes", // http://xeoengine.org/docs/classes/Modes.html
            transparent: false,
            backfaces: true
        });

        // When highlighting, causes this object to render after non-highlighted objects
        this.stage = this.create({
            type: "xeogl.Stage",
            priority: 0
        });

        // When highlighting, we use this component to disable depth-testing so that this object
        // appears to "float" over non-highlighted objects
        this.depthBuf = this.create({
            type: "xeogl.DepthBuf",
            active: true
        });

        // Create a xeogl.Entity for each xeogl.Geometry
        // Each xeogl.Entity shares the components defined above

        // TODO: If all geometries are of same primitive, then we can combine them

        this.entities = [];
        var entity;

        for (var i = 0, len = cfg.geometryIds.length; i < len; i++) {

            entity = this.create({ // http://xeoengine.org/docs/classes/Entity.html
                type: "xeogl.Entity",
                meta: {
                    objectId: this.id
                },
                geometry: "geometry." + cfg.geometryIds[i],
                transform: this.transform,
                visibility: this.visibility,
                material: this.material,
                modes: this.modes,
                stage: this.stage,
                depthBuf: this.depthBuf
            });

            this.entities.push(entity);
        }
    },

    add: function add(geometryId) {
        var entity = this.create({ // http://xeoengine.org/docs/classes/Entity.html
            type: "xeogl.Entity",
            meta: {
                objectId: this.id
            },
            geometry: "geometry." + geometryId,
            transform: this.transform,
            visibility: this.visibility,
            material: this.material,
            modes: this.modes,
            stage: this.stage,
            depthBuf: this.depthBuf
        });

        this.entities.push(entity);
    },

    // Define read-only properties of xeogl.BIMObject

    _props: {

        // World-space bounding volume
        worldBoundary: {
            get: function get() {
                return this.entities[0].worldBoundary;
            }
        },

        // View-space bounding volume
        viewBoundary: {
            get: function get() {
                return this.entities[0].viewBoundary;
            }
        },

        // Canvas-space bounding volume
        canvasBoundary: {
            get: function get() {
                return this.entities[0].viewBoundary;
            }
        },

        // Whether or not this object is highlighted
        highlighted: {
            set: function set(highlight) {
                this.depthBuf.active = !highlight;
                this.stage.priority = highlight ? 2 : 0;
                this.material.emissive = highlight ? [0.5, 0.5, 0.5] : [0, 0, 0];
            }
        }
    }
});

/**
 Custom xeoEngine component that shows a wireframe box representing an non axis-aligned 3D boundary.
 */
var BIMBoundaryHelperEntity = xeogl.Entity.extend({

    type: "xeogl.BIMBoundaryHelperEntity",

    _init: function _init(cfg) {

        var obbGeometry = this.create({
            type: "xeogl.OBBGeometry"
        });

        var phongMaterial = this.create({
            type: "xeogl.PhongMaterial",
            diffuse: cfg.color || [0.5, 0.5, 0.5],
            ambient: [0, 0, 0],
            specular: [0, 0, 0],
            lineWidth: 2
        });

        var nonCollidableMode = this.create({
            type: "xeogl.Modes",
            collidable: false // This helper has no collision boundary of its own
        });

        // Causes this entity to render after all other entities
        var stagePriorityThree = this.create({
            type: "xeogl.Stage",
            priority: 3
        });

        var visible = this.create({
            type: "xeogl.Visibility",
            visible: true
        });

        // Disables depth-testing so that this entity
        // appears to "float" over other entities
        var depthBufInactive = this.create({
            type: "xeogl.DepthBuf",
            active: false
        });

        this._super(xeogl._apply({
            geometry: obbGeometry,
            material: phongMaterial,
            modes: nonCollidableMode,
            stage: stagePriorityThree,
            depthBuf: depthBufInactive,
            visibility: visible
        }, cfg));
    }
});

xeogl.BIMBoundaryHelper = function (scene, viewer, cfg) {

    var self = this;

    self._entities = {};
    self._pool = [];

    self.setSelected = function (ids) {

        var oldIds = Object.keys(self._entities);

        ids.forEach(function (id) {
            if (!self._entities[id]) {
                var h;
                if (self._pool.length > 0) {
                    h = self._entities[id] = self._pool.shift();
                    h.visibility.visible = true;
                } else {
                    h = self._entities[id] = new BIMBoundaryHelperEntity(scene, cfg);
                }
                h.geometry.boundary = viewer.getObject(id).worldBoundary;
            }

            var oldIdx = oldIds.indexOf(id);
            if (oldIdx !== -1) {
                oldIds.splice(oldIdx, 1);
            }
        });

        oldIds.forEach(function (id) {
            var h = self._entities[id];
            h.visibility.visible = false;
            self._pool.push(h);
            delete self._entities[id];
        });
    };
};

xeogl.HighlightEffect = xeogl.Component.extend({

    type: "xeogl.HighlightEffect",

    _init: function _init(cfg) {

        this._modes = this.create({
            type: "xeogl.Modes",
            transparent: true,
            collidable: false // Has no collision boundary of its own
        });

        this._stage = this.create({
            type: "xeogl.Stage",
            priority: 2
        });

        this._depthBuf = this.create({
            type: "xeogl.DepthBuf",
            active: false
        });

        this._emissiveColor = (cfg.color || [0.2, 0.9, 0.2]).slice(0, 3);
        this._opacity = cfg.color && cfg.color.length > 3 ? cfg.color[3] : 0.25;

        this._helpers = {};
        this._freeHelpers = [];
    },

    add: function add(bimObject) {
        var entities = bimObject.entities;
        if (entities) {
            var entity;
            for (var i = 0, len = entities.length; i < len; i++) {
                entity = entities[i];
                this._createHelper(entity);
            }
        } else {
            this._createHelper(bimObject);
        }
    },

    _createHelper: function _createHelper(entity) {
        var helper = this._freeHelpers.pop();
        if (!helper) {
            helper = this.create({
                type: "xeogl.Entity",
                geometry: entity.geometry,
                transform: entity.transform,
                material: this.create({
                    type: "xeogl.PhongMaterial",
                    emissive: this._emissiveColor,
                    specular: [0, 0, 0],
                    diffuse: [0, 0, 0],
                    ambient: [0, 0, 0],
                    opacity: this._opacity
                }),
                modes: this._modes,
                stage: this._stage,
                depthBuf: this._depthBuf,
                visibility: this.create({
                    type: "xeogl.Visibility",
                    visible: true
                }),
                meta: {
                    entityId: entity.id
                }
            });
        } else {
            helper.geometry = entity.geometry;
            helper.material.diffuse = entity.material.diffuse;
            helper.material.ambient = entity.material.ambient;
            helper.transform = entity.transform;
            helper.visibility.visible = true;
            helper.meta.entityId = entity.id;
        }
        this._helpers[entity.id] = helper;
    },

    clear: function clear() {
        var helper;
        for (var id in this._helpers) {
            if (this._helpers.hasOwnProperty(id)) {
                helper = this._helpers[id];
                this._destroyHelper(helper);
            }
        }
    },

    remove: function remove(bimObject) {
        var entities = bimObject.entities;
        var entity;
        for (var i = 0, len = entities.length; i < len; i++) {
            entity = entities[i];
            var helper = this._helpers[entity.id];
            if (helper) {
                this._destroyHelper(helper);
            }
        }
    },

    _destroyHelper: function _destroyHelper(helper) {
        helper.visibility.visible = false;
        this._freeHelpers.push(helper);
        delete this._helpers[helper.meta.entityId];
    }

});

/**
 * Components for managing collections of components.
 *
 * @module xeogl
 * @submodule collections
 */ /**
     A **Collection** is a set of {{#crossLink "Component"}}Components{{/crossLink}}.
     <ul>
     <li>A {{#crossLink "Component"}}Component{{/crossLink}} can be included in more than one Collection.</li>
     <li>{{#crossLink "Component"}}Components{{/crossLink}} can be added to a Collection by instance, ID or type.</li>
     <li>A Collection supports iteration over its {{#crossLink "Component"}}Components{{/crossLink}}.</li>
     <li>A {{#crossLink "Model"}}Model{{/crossLink}} stores the {{#crossLink "Component"}}Components{{/crossLink}} it has loaded in a Collection.</li>
     <li>A {{#crossLink "CollectionBoundary"}}CollectionBoundary{{/crossLink}} provides a World-space {{#crossLink "Boundary3D"}}{{/crossLink}} that encloses a Collection.</li>
     </ul>
     <img src="../../../assets/images/Collection.png"></img>
     ## Examples
     <ul>
     <li>[Adding Entities to a Collection](../../examples/#collections_Collection_creating_add)</li>
     <li>[Adding components types to a Collection](../../examples/#collections_Collection_creating_type)</li>
     <li>[Iterating a Collection](../../examples/#boundaries_Collection_iterating)</li>
     <li>[Visualizing World-space boundary of a Collection](../../examples/#boundaries_CollectionBoundary)</li>
     <li>[Visualizing World-space boundaries of a hierarchy of Collections](../../examples/#boundaries_CollectionBoundary_hierarchy)</li>
     </ul>
     ## Creating Collections
     Our first Collection contains a {{#crossLink "PhongMaterial"}}{{/crossLink}}, added by ID, plus a {{#crossLink "BoxGeometry"}}{{/crossLink}} and
     an {{#crossLink "Entity"}}{{/crossLink}}, both added by instance.
     ````javascript
     var material = new xeogl.PhongMaterial({
      id: "myMaterial",
      diffuse: [0.5, 0.5, 0.0]
     });
     var geometry = new xeogl.BoxGeometry();
     var entity = new xeogl.Entity({
     id: "myEntity",
     material: material,
     geometry: geometry
     });
     var collection1 = new xeogl.Collection({ // Initialize with the three components
      components: [
          "myMaterial",
          geometry,
          myEntity
      ]
     });
     ````
     Our second Collection includes the {{#crossLink "BoxGeometry"}}{{/crossLink}}, added by instance,
     and the {{#crossLink "Entity"}}{{/crossLink}}, added by type. If there were more than
     one {{#crossLink "Entity"}}{{/crossLink}} in the scene, then that type would ensure
     that all the {{#crossLink "Entity"}}Entities{{/crossLink}} were in the Collection.
     ````javascript
     var collection2 = new xeogl.Collection();
     collection2.add([  // Add two components
     geometry,
     "xeogl.Entity",
     ]);
     ````
     ## Accessing Components
     Iterate over the components in a Collection using the convenience iterator:
     ````javascript
     collection1.iterate(function(component) {
      if (component.isType("xeogl.Entity")) {
          this.log("Found the Entity: " + component.id);
      }
      //..
     });
     ````
     A Collection also registers its components by type:
     ````javascript
     var entities = collection1.types["xeogl.Entity"];
     var theEntity = entities["myEntity"];
     ````
     ## Removing Components
     We can remove components from a Collection by instance, ID or type:
     ````javascript
     collection1.remove("myMaterial"); // Remove one component by ID
     collection1.remove([geometry, myEntity]); // Remove two components by instance
     collection2.remove("xeogl.Geometry"); // Remove all Geometries
     ````
     ## Getting the boundary of a Collection
     A {{#crossLink "CollectionBoundary"}}{{/crossLink}} provides a {{#crossLink "Boundary3D"}}{{/crossLink}} that
     dynamically fits to the collective World-space boundary of all the Components in a Collection.
     ````javascript
     var collectionBoundary = new xeogl.CollectionBoundary({
     collection: collection1
     });
     var worldBoundary = collectionBoundary.worldBoundary;
     ````
     The {{#crossLink "Boundary3D"}}{{/crossLink}}
     will automatically update whenever we add, remove or update any Components that have World-space boundaries. We can subscribe
     to updates on it like so:
     ````javascript
     worldBoundary.on("updated", function() {
      obb = worldBoundary.obb;
      aabb = worldBoundary.aabb;
      center = worldBoundary.center;
      //...
     });
     ````
     Now, if we now re-insert our {{#crossLink "Entity"}}{{/crossLink}} into to our Collection,
     the {{#crossLink "Boundary3D"}}{{/crossLink}} will fire our update handler.
     ````javascript
     collection1.add(myEntity);
     ````
      @class Collection
     @module xeogl
     @submodule collections
     @constructor
     @param [scene] {Scene} Parent {{#crossLink "Scene"}}{{/crossLink}}.
     @param [cfg] {*} Configs
     @param [cfg.id] {String} Optional ID, unique among all components in the parent scene, generated automatically when omitted.
     @param [cfg.meta] {String:Component} Optional map of user-defined metadata to attach to this Collection.
     @param [cfg.components] {{Array of String|Component}} Array of {{#crossLink "Component"}}{{/crossLink}} IDs or instances.
     @extends Component
     */
xeogl.Collection = xeogl.Component.extend({

            /**
             JavaScript class name for this Component.
               @property type
             @type String
             @final
             */
            type: "xeogl.Collection",

            _init: function _init(cfg) {

                        /**
                         * The {{#crossLink "Components"}}{{/crossLink}} within this Collection, mapped to their IDs.
                         *
                         * Fires an {{#crossLink "Collection/updated:event"}}{{/crossLink}} event on change.
                         *
                         * @property components
                         * @type {{String:Component}}
                         */
                        this.components = {};

                        /**
                         * The number of {{#crossLink "Components"}}{{/crossLink}} within this Collection.
                         *
                         * @property numComponents
                         * @type Number
                         */
                        this.numComponents = 0;

                        /**
                         * A map of maps; for each {{#crossLink "Component"}}{{/crossLink}} type in this Collection,
                         * a map to IDs to {{#crossLink "Component"}}{{/crossLink}} instances, eg.
                         *
                         * ````
                         * "xeogl.Geometry": {
                         *   "alpha": <xeogl.Geometry>,
                         *   "beta": <xeogl.Geometry>
                         * },
                         * "xeogl.Rotate": {
                         *   "charlie": <xeogl.Rotate>,
                         *   "delta": <xeogl.Rotate>,
                         *   "echo": <xeogl.Rotate>,
                         * },
                         * //...
                         * ````
                         *
                         * @property types
                         * @type {String:{String:xeogl.Component}}
                         */
                        this.types = {};

                        // Subscriptions to "destroyed" events from components
                        this._destroyedSubs = {};

                        if (cfg.components) {
                                    this.add(cfg.components);
                        }
            },

            /**
             * Adds one or more {{#crossLink "Component"}}Components{{/crossLink}}s to this Collection.
             *
             * The {{#crossLink "Component"}}Component(s){{/crossLink}} may be specified by instance, ID or type.
             *
             * See class comment for usage examples.
             *
             * The {{#crossLink "Component"}}Components{{/crossLink}} must be in the same {{#crossLink "Scene"}}{{/crossLink}} as this Collection.
             *
             * Fires an {{#crossLink "Collection/added:event"}}{{/crossLink}} event.
             *
             * @method add
             * @param {Array of Component} components Array of {{#crossLink "Component"}}Components{{/crossLink}} instances.
             */
            add: function add(components) {

                        components = xeogl._isArray(components) ? components : [components];

                        for (var i = 0, len = components.length; i < len; i++) {
                                    this._add(components[i]);
                        }
            },

            _add: function _add(c) {

                        var componentId;
                        var component;
                        var type;
                        var types;

                        if (c.type) {

                                    // Component instance

                                    component = c;
                        } else if (xeogl._isNumeric(c) || xeogl._isString(c)) {

                                    if (this.scene.types[c]) {

                                                // Component type

                                                type = c;

                                                types = this.scene.types[type];

                                                if (!types) {
                                                            this.warn("Component type not found: '" + type + "'");
                                                            return;
                                                }

                                                for (componentId in types) {
                                                            if (types.hasOwnProperty(componentId)) {
                                                                        this._add(types[componentId]);
                                                            }
                                                }

                                                return;
                                    } else {

                                                // Component ID

                                                component = this.scene.components[c];

                                                if (!component) {
                                                            this.warn("Component not found: " + xeogl._inQuotes(c));
                                                            return;
                                                }
                                    }
                        } else {

                                    return;
                        }

                        if (component.scene !== this.scene) {

                                    // Component in wrong Scene

                                    this.warn("Attempted to add component from different xeogl.Scene: " + xeogl._inQuotes(component.id));
                                    return;
                        }

                        // Add component to this map

                        if (this.components[component.id]) {

                                    // Component already in this Collection
                                    return;
                        }

                        this.components[component.id] = component;

                        // Register component for its type

                        types = this.types[component.type];

                        if (!types) {
                                    types = this.types[component.type] = {};
                        }

                        types[component.id] = component;

                        this.numComponents++;

                        // Remove component when it's destroyed

                        var self = this;

                        this._destroyedSubs[component.id] = component.on("destroyed", function () {
                                    self._remove(component);
                        });

                        /**
                         * Fired whenever an individual {{#crossLink "Component"}}{{/crossLink}} is added to this {{#crossLink "Collection"}}{{/crossLink}}.
                         * @event added
                         * @param value {Component} The {{#crossLink "Component"}}{{/crossLink}} that was added.
                         */
                        this.fire("added", component);

                        if (!this._dirty) {
                                    this._scheduleUpdate();
                        }
            },

            _scheduleUpdate: function _scheduleUpdate() {
                        if (!this._dirty) {
                                    this._dirty = true;
                                    xeogl.scheduleTask(this._notifyUpdated, this);
                        }
            },

            _notifyUpdated: function _notifyUpdated() {

                        /* Fired on the next {{#crossLink "Scene/tick.animate:event"}}{{/crossLink}} whenever
                         * {{#crossLink "Component"}}Components{{/crossLink}} were added or removed since the
                         * last {{#crossLink "Scene/tick.animate:event"}}{{/crossLink}} event, to provide a batched change event
                         * for subscribers who don't want to react to every individual addition or removal on this Collection.
                         *
                         * @event updated
                         */
                        this.fire("updated");
                        this._dirty = false;
            },

            /**
             * Removes all {{#crossLink "Component"}}Components{{/crossLink}} from this Collection.
             *
             * Fires an {{#crossLink "Collection/updated:event"}}{{/crossLink}} event.
             *
             * @method clear
             */
            clear: function clear() {

                        this.iterate(function (component) {
                                    this._remove(component);
                        });
            },

            /**
             * Destroys all {{#crossLink "Component"}}Components{{/crossLink}} in this Collection.
             *
             * @method destroyAll
             */
            destroyAll: function destroyAll() {

                        this.iterate(function (component) {
                                    component.destroy();
                        });
            },

            /**
             * Removes one or more {{#crossLink "Component"}}Components{{/crossLink}} from this Collection.
             *
             * The {{#crossLink "Component"}}Component(s){{/crossLink}} may be specified by instance, ID or type.
             *
             * See class comment for usage examples.
             *
             * Fires a {{#crossLink "Collection/removed:event"}}{{/crossLink}} event.
             *
             * @method remove
             * @param {Array of Components} components Array of {{#crossLink "Component"}}Components{{/crossLink}} instances.
             */
            remove: function remove(components) {

                        components = xeogl._isArray(components) ? components : [components];

                        for (var i = 0, len = components.length; i < len; i++) {
                                    this._remove(components[i]);
                        }
            },

            _remove: function _remove(component) {

                        var componentId = component.id;

                        if (component.scene !== this.scene) {
                                    this.warn("Attempted to remove component that's not in same xeogl.Scene: '" + componentId + "'");
                                    return;
                        }

                        delete this.components[componentId];

                        // Unsubscribe from component destruction

                        component.off(this._destroyedSubs[componentId]);

                        delete this._destroyedSubs[componentId];

                        // Unregister component for its type

                        var types = this.types[component.type];

                        if (types) {
                                    delete types[component.id];
                        }

                        this.numComponents--;

                        /**
                         * Fired whenever an individual {{#crossLink "Component"}}{{/crossLink}} is removed from this {{#crossLink "Collection"}}{{/crossLink}}.
                         * @event removed
                         * @param value {Component} The {{#crossLink "Component"}}{{/crossLink}} that was removed.
                         */
                        this.fire("removed", component);

                        if (!this._dirty) {
                                    this._scheduleUpdate();
                        }
            },

            /**
             * Iterates with a callback over the {{#crossLink "Component"}}Components{{/crossLink}} in this Collection.
             *
             * @method iterate
             * @param {Function} callback Callback called for each {{#crossLink "Component"}}{{/crossLink}}.
             * @param {Object} [scope=this] Optional scope for the callback, defaults to this Collection.
             */
            iterate: function iterate(callback, scope) {
                        scope = scope || this;
                        var components = this.components;
                        for (var componentId in components) {
                                    if (components.hasOwnProperty(componentId)) {
                                                callback.call(scope, components[componentId]);
                                    }
                        }
            },

            _getJSON: function _getJSON() {

                        var componentIds = [];

                        for (var componentId in this.components) {
                                    if (this.components.hasOwnProperty(componentId)) {
                                                componentIds.push(this.components[componentId].id); // Don't convert numbers into strings
                                    }
                        }

                        return {
                                    components: componentIds
                        };
            },

            _destroy: function _destroy() {

                        this.clear();
            }
});

var xeoViewer = function (_EventHandler) {
	inherits(xeoViewer, _EventHandler);

	function xeoViewer(cfg) {
		classCallCheck(this, xeoViewer);

		// Distance to WebGL's far clipping plane.
		var _this = possibleConstructorReturn(this, (xeoViewer.__proto__ || Object.getPrototypeOf(xeoViewer)).call(this));
		// Create xeoViewer


		var FAR_CLIP = 5000;

		var domNode = document.getElementById(cfg.domNode);
		var canvas = document.createElement("canvas");

		domNode.appendChild(canvas);

		// Create a Scene
		_this.scene = new xeogl.Scene({ // http://xeoengine.org/docs/classes/Scene.html
			canvas: canvas,
			transparent: true
		});

		// Redefine default light sources;
		_this.lights = [{
			type: "ambient",
			params: {
				color: [0.65, 0.65, 0.75],
				intensity: 1
			}
		}, {
			type: "dir",
			params: {
				dir: [0.0, 0.0, -1.0],
				color: [1.0, 1.0, 1.0],
				intensity: 1.0,
				space: "view"
			}
		}];
		_this.scene.lights.lights = _this.buildLights(_this.lights);

		// Attached to all objects to fit the model inside the view volume
		_this.scale = new xeogl.Scale(_this.scene, {
			xyz: [1, 1, 1]
		});

		// Provides user input
		_this.input = _this.scene.input;

		// Using the scene's default camera
		_this.camera = _this.scene.camera;
		_this.camera.project.far = FAR_CLIP;

		// Flies cameras to objects
		_this.cameraFlight = new xeogl.CameraFlightAnimation(_this.scene, { // http://xeoengine.org/docs/classes/CameraFlightAnimation.html
			fitFOV: 25,
			duration: 1
		});

		// Registers loaded xeoEngine components for easy destruction
		_this.collection = new xeogl.Collection(_this.scene); // http://xeoengine.org/docs/classes/Collection.html

		// Shows a wireframe box at the given boundary
		_this.boundaryHelper = new xeogl.BIMBoundaryHelper(_this.scene, _this, { color: cfg.selectionBorderColor });

		_this.highlightEffect = new xeogl.HighlightEffect(_this.scene, { color: cfg.selectionColor });

		// Models mapped to their IDs
		_this.models = {};

		// Objects mapped to IDs
		_this.objects = {};

		_this.objects_by_guid = {};

		// For each RFC type, a map of objects mapped to their IDs
		_this.rfcTypes = {};

		// Objects that are currently visible, mapped to IDs
		_this.visibleObjects = {};

		// Lazy-generated array of visible object IDs, for return by #getVisibility()
		_this.visibleObjectList = null;

		// Array of objects RFC types hidden by default
		_this.hiddenTypes = ["IfcOpeningElement", "IfcSpace"];

		// Objects that are currently selected, mapped to IDs
		_this.selectedObjects = {};

		// Lazy-generated array of selected object IDs, for return by #getSelection()
		_this.selectedObjectList = null;

		// Bookmark of initial state to reset to - captured with #saveReset(), applied with #reset().
		_this.resetBookmark = null;

		// Component for each projection type,
		// to swap on the camera when we switch projection types
		_this.projections = {

			persp: _this.camera.project, // Camera has a xeogl.Perspective by default

			ortho: new xeogl.Ortho(_this.scene, {
				scale: 1.0,
				near: 0.1,
				far: FAR_CLIP
			})
		};

		// The current projection type
		_this.projectionType = "persp";

		//-----------------------------------------------------------------------------------------------------------
		// Camera notifications
		//-----------------------------------------------------------------------------------------------------------


		// Fold xeoEngine's separate events for view and projection updates
		// into a single "camera-changed" event, deferred to fire on next scene tick.

		var cameraUpdated = false;

		_this.camera.on("projectMatrix", function () {
			cameraUpdated = true;
		});

		_this.camera.on("viewMatrix", function () {
			cameraUpdated = true;
		});

		_this.scene.on("tick", function () {

			/**
    * Fired on the iteration of each "game loop" for this xeoViewer.
    * @event tick
    * @param {String} sceneID The ID of this Scene.
    * @param {Number} startTime The time in seconds since 1970 that this xeoViewer was instantiated.
    * @param {Number} time The time in seconds since 1970 of this "tick" event.
    * @param {Number} prevTime The time of the previous "tick" event from this xeoViewer.
    * @param {Number} deltaTime The time in seconds since the previous "tick" event from this xeoViewer.
    */
			_this.fire("tick");

			if (cameraUpdated) {

				/**
     * Fired whenever this xeoViewer's camera changes.
     * @event camera-changed
     * @params New camera state, same as that got with #getCamera.
     */
				_this.fire("camera-changed", [_this.getCamera()]);
				cameraUpdated = false;
			}
		});

		//-----------------------------------------------------------------------------------------------------------
		// Camera control
		//-----------------------------------------------------------------------------------------------------------

		_this.cameraControl = new xeogl.BIMCameraControl(_this.scene, {
			camera: _this.camera
		});

		_this.cameraControl.on("pick", function (hit) {
			// Get BIM object ID from entity metadata
			var entity = hit.entity;

			if (!entity.meta) {
				return;
			}

			var objectId = entity.meta.objectId || entity.id;

			if (objectId === undefined) {
				return;
			}

			var selected = !!_this.selectedObjects[objectId]; // Object currently selected?
			var shiftDown = _this.scene.input.keyDown[_this.input.KEY_SHIFT]; // Shift key down?

			_this.setSelection({
				ids: [objectId],
				selected: !selected, // Picking an object toggles its selection status
				clear: !shiftDown // Clear selection first if shift not down
			});
		});

		_this.cameraControl.on("nopick", function (hit) {
			_this.setSelection({
				clear: true
			});
		});
		return _this;
	}

	/**
  * Sets the default behaviour of mouse and touch drag input
  *
  * @method setDefaultDragAction
  * @param {String} action ("pan" | "orbit")
  */


	createClass(xeoViewer, [{
		key: 'setDefaultDragAction',
		value: function setDefaultDragAction(action) {
			this.cameraControl.defaultDragAction = action;
		}

		/**
   * Sets the global scale for models loaded into the viewer.
   *
   * @method setScale
   * @param {Number} s Scale factor.
   */

	}, {
		key: 'setScale',
		value: function setScale(s) {
			this.scale.xyz = [s, s, s];
		}

		/**
   * Notifies the viewer that a task (such as loading a model) has started. Use #taskFinished
   * to signal that the task has finished.
   *
   * Whenever the number of tasks is greater than zero, the viewer will display a spinner,
   * and reduce rendering speed so as to allow scene updates to happen faster.
   */

	}, {
		key: 'taskStarted',
		value: function taskStarted() {
			this.scene.canvas.spinner.processes++;
			this.scene.ticksPerRender = 15; // Tweak this if necessary
		}

		/**
   * Signals that a task has finished (see #taskStarted).
   */

	}, {
		key: 'taskFinished',
		value: function taskFinished() {
			var spinner = this.scene.canvas.spinner;
			if (spinner.processes === 0) {
				return;
			}
			spinner.processes--;
			if (spinner.processes === 0) {
				this.scene.ticksPerRender = 1; // Back to max speed, one render per tick
			}
		}

		/**
   * Loads random objects into the viewer for testing.
   *
   * Subsequent calls to #reset will then set the viewer to the state right after the model was loaded.
   *
   * @method loadRandom
   * @param {*} params Parameters
   * @param {Number} [params.numEntities=200] Number of entities to create.
   * @param {Number} [params.size=200] Size of model on every axis.
   * @param {Float32Array} [params.center] Center point of model.
   */

	}, {
		key: 'loadRandom',
		value: function loadRandom(params) {

			params = params || {};

			this.clear();

			var geometry = new xeogl.BoxGeometry(this.scene, {
				id: "geometry.test"
			});

			this.collection.add(geometry);

			var modelId = "test";
			var roid = "test";
			var oid = void 0;
			var type = void 0;
			var objectId = void 0;
			var translate = void 0;
			var scale = void 0;
			var matrix = void 0;
			var types = Object.keys(DefaultMaterials);

			var numEntities = params.numEntities || 200;
			var size = params.size || 200;
			var halfSize = size / 2;
			var centerX = params.center ? params.center[0] : 0;
			var centerY = params.center ? params.center[1] : 0;
			var centerZ = params.center ? params.center[2] : 0;

			this.createModel(modelId);

			for (var i = 0; i < numEntities; i++) {
				objectId = "object" + i;
				oid = objectId;
				translate = xeogl.math.translationMat4c(Math.random() * size - halfSize + centerX, Math.random() * size - halfSize + centerY, Math.random() * size - halfSize + centerZ);
				scale = xeogl.math.scalingMat4c(Math.random() * 32 + 0.2, Math.random() * 32 + 0.2, Math.random() * 10 + 0.2);
				matrix = xeogl.math.mulMat4(translate, scale, xeogl.math.mat4());
				type = types[Math.round(Math.random() * types.length)];
				this.createObject(modelId, roid, oid, objectId, ["test"], type, matrix);
			}

			// Set camera just to establish the up vector as +Z; the following
			// call to viewFit() will arrange the eye and target positions properly.
			this.setCamera({
				eye: [0, 0, 0],
				target: [centerX, centerY, centerZ],
				up: [0, 0, 1]
			});

			this.viewFit();

			this.saveReset();
		}

		/**
   * Creates a geometry.
   *
   * @method createGeometry
   * @param geometryId
   * @param positions
   * @param normals
   * @param colors
   * @param indices
   * @returns {xeogl.Geometry} The new geometry
   * @private
   */

	}, {
		key: 'createGeometry',
		value: function createGeometry(geometryId, positions, normals, colors, indices) {
			var geometry = new xeogl.Geometry(this.scene, { // http://xeoengine.org/docs/classes/Geometry.html
				id: "geometry." + geometryId,
				primitive: "triangles",
				positions: positions,
				normals: normals,
				colors: colors,
				indices: indices
			});

			this.collection.add(geometry);

			return geometry;
		}

		/**
   * Creates a model.
   *
   * @param modelId
   * @returns {xeogl.BIMModel} The new model
   * @private
   */

	}, {
		key: 'createModel',
		value: function createModel(modelId) {

			if (this.models[modelId]) {
				console.log("Model with id " + modelId + " already exists, won't recreate");
				return;
			}

			var model = new xeogl.BIMModel(this.scene, {});

			this.models[modelId] = model;

			this.collection.add(model);

			return model;
		}

		/**
   * Creates an object.
   * @param [modelId] Optional model ID
   * @param roid
   * @param oid
   * @param objectId
   * @param geometryIds
   * @param type
   * @param matrix
   * @returns {xeogl.BIMObject} The new object
   * @private
   */

	}, {
		key: 'createObject',
		value: function createObject(modelId, roid, oid, objectId, geometryIds, type, matrix) {
			var model = void 0;

			if (modelId) {
				model = this.models[modelId];
				if (!model) {
					console.log("Can't create object - model not found: " + modelId);
					return;
				}
				objectId = modelId + ":" + objectId;
			}

			if (this.objects[objectId]) {
				console.log("Object with id " + objectId + " already exists, won't recreate");
				return;
			}

			var object = new xeogl.BIMObject(this.scene, {
				id: objectId,
				geometryIds: geometryIds,
				matrix: matrix
			});

			object.transform.parent = this.scale; // Apply model scaling

			this._addObject(type, object);

			if (model) {
				model.collection.add(object);
			}

			// Hide objects of certain types by default
			if (this.hiddenTypes.indexOf(type) !== -1) {
				object.visibility.visible = false;
			}

			return object;
		}

		/**
   * Inserts an object into this viewer
   *
   * @param {String} type
   * @param {xeogl.Entity | xeogl.BIMObject} object
   * @private
   */

	}, {
		key: '_addObject',
		value: function _addObject(type, object) {
			var guid = void 0;
			if (object.id.indexOf("#") !== -1) {
				guid = Utils.CompressGuid(object.id.split("#")[1].substr(8, 36).replace(/-/g, ""));
			}
			this.collection.add(object);

			// Register object against ID
			this.objects[object.id] = object;
			if (guid) {
				(this.objects_by_guid[guid] || (this.objects_by_guid[guid] = [])).push(object);
			}

			// Register object against IFC type
			var types = this.rfcTypes[type] || (this.rfcTypes[type] = {});
			types[object.id] = object;

			var color = DefaultMaterials[type] || DefaultMaterials.DEFAULT;

			if (!guid) {
				object.material.diffuse = [color[0], color[1], color[2]];
			}
			object.material.specular = [0, 0, 0];

			if (color[3] < 1) {
				// Transparent object
				object.material.opacity = color[3];
				object.modes.transparent = true;
			}
			if (object.material.opacity < 1) {
				// Transparent object
				object.modes.transparent = true;
			}
		}

		/**
   * Loads glTF model.
   *
   * Subsequent calls to #reset will then set the viewer to the state right after the model was loaded.
   *
   * @param src
   */

	}, {
		key: 'loadglTF',
		value: function loadglTF(src) {
			var _this2 = this;

			this.clear();

			var model = new xeogl.GLTFModel(this.scene, {
				src: src
			});

			this.collection.add(model);

			this.models[model.id] = model;

			model.on("loaded", function () {

				// TODO: viewFit, but boundaries not yet ready on Model Entities

				model.iterate(function (component) {
					if (component.isType("xeogl.Entity")) {
						_this2._addObject("DEFAULT", component);
					}
				});

				_this2.saveReset();
			});

			return model;
		}

		/**
   * Destroys a model and all its objects.
   *
   * @param modelId
   */

	}, {
		key: 'destroyModel',
		value: function destroyModel(modelId) {

			var model = this.models[modelId];

			if (!model) {
				console.warn("Can't destroy model - model not found: " + modelId);
				return;
			}

			model.collection.iterate(function (component) {
				component.destroy();
			});

			model.destroy();

			delete this.models[modelId];
		}

		/**
   * Clears the viewer.
   *
   * Subsequent calls to #reset will then set the viewer this clear state.
   */

	}, {
		key: 'clear',
		value: function clear() {

			var list = [];

			this.collection.iterate(function (component) {
				list.push(component);
			});

			while (list.length) {
				list.pop().destroy();
			}

			this.objects = {};
			this.rfcTypes = {};
			this.visibleObjects = {};
			this.visibleObjectList = null;
			this.selectedObjects = {};
			this.selectedObjectList = null;

			this.saveReset();
		}

		/**
   * Sets the visibility of objects specified by IDs or IFC types.
   * If IFC types are specified, this will affect existing objects as well as subsequently loaded objects of these types
   *
   * @param params
   * @param params.ids IDs of objects or IFC types to update.
   * @param params.color Color to set.
   */

	}, {
		key: 'setVisibility',
		value: function setVisibility(params) {
			var _this3 = this;

			var changed = false; // Only fire "visibility-changed" when visibility updates are actually made
			params = params || {};

			var ids = params.ids;
			var types = params.types;

			if (!ids && !types) {
				console.error("Param expected: ids or types");
				return;
			}

			ids = ids || [];
			types = types || [];

			//const recursive = !!params.recursive;
			var visible = params.visible !== false;

			var i = void 0;
			var len = void 0;
			var id = void 0;
			var objectId = void 0;

			if (params.clear) {
				for (objectId in this.visibleObjects) {
					if (this.visibleObjects.hasOwnProperty(objectId)) {
						delete this.visibleObjects[objectId];
						changed = true;
					}
				}
			}

			var _loop = function _loop() {
				var type = types[i];
				var typedict = _this3.rfcTypes[type] || {};

				Object.keys(typedict).forEach(function (id) {
					var object = typedict[id];
					object.visibility.visible = visible;
					changed = true;
				});

				var index = _this3.hiddenTypes.indexOf(type);

				if (index !== -1 && visible) {
					_this3.hiddenTypes.splice(index, 1); // remove type from array
				} else if (index === -1 && !visible) {
					_this3.hiddenTypes.push(type); // add type to array
				}
			};

			for (i = 0, len = types.length; i < len; i++) {
				_loop();
			}

			for (i = 0, len = ids.length; i < len; i++) {
				id = ids[i];
				var fn = function fn(object) {
					object.visibility.visible = visible;
					changed = true;
				};
				var object_ = this.objects[id];
				if (!object_) {
					this.objects_by_guid[id].forEach(fn);
				} else {
					fn(object_);
				}
			}

			if (changed) {
				this.visibleObjectList = Object.keys(this.visibleObjects);

				/**
     * Fired whenever objects become invisible or invisible
     * @event visibility-changed
     * @params Array of IDs of all currently-visible objects.
     */
				this.fire("visibility-changed", [this.visibleObjectList]);
			}
		}

		/**
   * Returns array of IDs of objects that are currently visible
   */

	}, {
		key: 'getVisibility',
		value: function getVisibility() {
			if (this.visibleObjectList) {
				return this.visibleObjectList;
			}
			this.visibleObjectList = Object.keys(this.visibleObjects);
			return this.visibleObjectList;
		}

		/**
   * Select or deselect some objects.
   *
   * @param params
   * @param params.ids IDs of objects.
   * @param params.selected Whether to select or deselect the objects
   * @param params.clear Whether to clear selection state prior to updating
   */

	}, {
		key: 'setSelection',
		value: function setSelection(params) {
			var _this4 = this;

			params = params || {};

			var changed = false; // Only fire "selection-changed" when selection actually changes
			var selected = !!params.selected;
			var objectId = void 0;
			if (params.clear) {
				for (objectId in this.selectedObjects) {
					if (this.selectedObjects.hasOwnProperty(objectId)) {
						delete this.selectedObjects[objectId];
						changed = true;
					}
				}
			}

			var ids = params.ids;

			if (ids) {

				for (var i = 0, len = ids.length; i < len; i++) {

					var fn = function fn(object) {

						var objectId = object.id;

						if (!!_this4.selectedObjects[objectId] !== selected) {
							changed = true;
						}

						if (selected) {
							_this4.selectedObjects[objectId] = object;
						} else {
							if (_this4.selectedObjects[objectId]) {
								delete _this4.selectedObjects[objectId];
							}
						}

						_this4.selectedObjectList = null; // Now needs lazy-rebuild
					};

					objectId = ids[i];
					var object_ = this.objects[objectId];
					if (!object_) {
						this.objects_by_guid[objectId].forEach(fn);
					} else {
						fn(object_);
					}
				}
			}

			if (changed) {

				this.selectedObjectList = Object.keys(this.selectedObjects);

				// Show boundary around selected objects
				this.setBoundaryState({
					ids: this.selectedObjectList,
					show: this.selectedObjectList.length > 0
				});

				/**
     * Fired whenever this xeoViewer's selection state changes.
     * @event selection-changed
     * @params Array of IDs of all currently-selected objects.
     */
				this.fire("selection-changed", [this.selectedObjectList]);
			}
		}

		/**
   * Returns array of IDs of objects that are currently selected
   */

	}, {
		key: 'getSelection',
		value: function getSelection() {
			if (this.selectedObjectList) {
				return this.selectedObjectList;
			}
			this.selectedObjectList = Object.keys(this.selectedObjects);
			return this.selectedObjectList;
		}

		/**
   * Sets the color of objects specified by IDs or IFC types.
   *
   * @param params
   * @param params.ids IDs of objects to update.
   * @param params.types IFC type of objects to update.
   * @param params.color Color to set.
   */

	}, {
		key: 'setColor',
		value: function setColor(params) {
			var _this5 = this;

			params = params || {};

			var ids = params.ids;
			var types = params.types;

			if (!ids && !types) {
				console.error("Param expected: ids or types");
				return;
			}

			ids = ids || [];
			types = types || [];

			var color = params.color;

			if (!color) {
				console.error("Param expected: 'color'");
				return;
			}

			var objectId = void 0;
			var object = void 0;

			var _loop2 = function _loop2(i, len) {
				var typedict = _this5.rfcTypes[types[i]] || {};
				Object.keys(typedict).forEach(function (id) {
					var object = typedict[id];
					_this5._setObjectColor(object, color);
				});
			};

			for (var i = 0, len = types.length; i < len; i++) {
				_loop2(i, len);
			}

			for (var i = 0, len = ids.length; i < len; i++) {

				objectId = ids[i];
				object = this.objects[objectId] || this.objects_by_guid[objectId];

				if (!object) {
					// No return on purpose to continue changing color of
					// other potentially valid object identifiers.
					console.error("Object not found: '" + objectId + "'");
				} else {
					this._setObjectColor(object, color);
				}
			}
		}
	}, {
		key: '_setObjectColor',
		value: function _setObjectColor(object, color) {

			var material = object.material;
			material.diffuse = [color[0], color[1], color[2]];

			var opacity = color.length > 3 ? color[3] : 1;
			if (opacity !== material.opacity) {
				material.opacity = opacity;
				object.modes.transparent = opacity < 1;
			}
		}

		/**
   * Sets the opacity of objects specified by IDs of IFC types.
   *
   * @param params
   * @param params.ids IDs of objects to update.
   * @param params.types IFC type of objects to update.
   * @param params.opacity Opacity to set.
   */

	}, {
		key: 'setOpacity',
		value: function setOpacity(params) {
			var _this6 = this;

			params = params || {};

			var ids = params.ids;
			var types = params.types;

			if (!ids && !types) {
				console.error("Param expected: ids or types");
				return;
			}

			ids = ids || [];
			types = types || [];

			var opacity = params.opacity;

			if (opacity === undefined) {
				console.error("Param expected: 'opacity'");
				return;
			}

			var objectId = void 0;
			var object = void 0;

			var _loop3 = function _loop3(i, len) {
				var typedict = _this6.rfcTypes[types[i]] || {};
				Object.keys(typedict).forEach(function (id) {
					var object = typedict[id];
					_this6._setObjectOpacity(object, opacity);
				});
			};

			for (var i = 0, len = types.length; i < len; i++) {
				_loop3(i, len);
			}

			for (var i = 0, len = ids.length; i < len; i++) {

				objectId = ids[i];
				object = this.objects[objectId] || this.objects_by_guid[objectId];

				if (!object) {
					// No return on purpose to continue changing opacity of
					// other potentially valid object identifiers.
					console.error("Object not found: '" + objectId + "'");
				} else {
					this._setObjectOpacity(object, opacity);
				}
			}
		}
	}, {
		key: '_setObjectOpacity',
		value: function _setObjectOpacity(object, opacity) {

			var material = object.material;

			if (opacity !== material.opacity) {
				material.opacity = opacity;
				object.modes.transparent = opacity < 1;
			}
		}

		/**
   * Sets camera state.
   *
   * @param params
   */

	}, {
		key: 'setCamera',
		value: function setCamera(params) {

			params = params || {};

			// Set projection type

			var type = params.type;

			if (type && type !== this.projectionType) {

				var projection = this.projections[type];

				if (!projection) {
					console.error("Unsupported camera projection type: " + type);
				} else {
					this.camera.project = projection;
					this.projectionType = type;
				}
			}

			// Set camera position

			if (params.animate) {

				this.cameraFlight.flyTo({
					eye: params.eye,
					look: params.target,
					up: params.up,
					fitFOV: params.fitFOV,
					duration: params.duration
				});
			} else {

				if (params.eye) {
					this.camera.view.eye = params.eye;
				}

				if (params.target) {
					this.camera.view.look = params.target;
					this.cameraControl.rotatePos = this.camera.view.look; // Rotate about target initially
				}

				if (params.up) {
					this.camera.view.up = params.up;
				}
			}

			// Set camera FOV angle, only if currently perspective

			if (params.fovy) {
				if (this.projectionType !== "persp") {
					console.error("Ignoring update to 'fovy' for current '" + this.projectionType + "' camera");
				} else {
					this.camera.project.fovy = params.fovy;
				}
			}

			// Set camera view volume size, only if currently orthographic

			if (params.scale) {
				if (this.projectionType !== "ortho") {
					console.error("Ignoring update to 'scale' for current '" + this.projectionType + "' camera");
				} else {
					this.camera.project.scale = params.scale;
				}
			}
		}

		/**
   * Gets camera state.
   *
   * @returns {{type: string, eye: (*|Array.<T>), target: (*|Array.<T>), up: (*|Array.<T>)}}
   */

	}, {
		key: 'getCamera',
		value: function getCamera() {

			var view = this.camera.view;

			var json = {
				type: this.projectionType,
				eye: view.eye.slice(0),
				target: view.look.slice(0),
				up: view.up.slice(0)
			};

			var project = this.camera.project;

			if (this.projectionType === "persp") {
				json.fovy = project.fovy;
			} else if (this.projectionType === "ortho") {
				json.size = [1, 1, 1]; // TODO: efficiently derive from cached value or otho volume
			}

			return json;
		}

		/**
   * Redefines light sources.
   * 
   * @param params Array of lights {type: "ambient"|"dir"|"point", params: {[...]}}
   * See http://xeoengine.org/docs/classes/Lights.html for possible params for each light type
   */

	}, {
		key: 'setLights',
		value: function setLights(params) {
			this.lights = params;

			for (var i = this.scene.lights.lights.length - 1; i >= 0; i--) {
				this.scene.lights.lights[i].destroy();
			}

			this.scene.lights.lights = this.buildLights(this.lights);
		}

		/**
   * Returns light sources.
   * 
   * @returns Array of lights {type: "ambient"|"dir"|"point", params: {[...]}}
   */

	}, {
		key: 'getLights',
		value: function getLights() {
			return this.lights;
		}
	}, {
		key: 'buildLights',
		value: function buildLights(lights) {
			var _this7 = this;

			return lights.map(function (light) {
				if (light.type == "ambient") {
					return new xeogl.AmbientLight(_this7.scene, light.params);
				} else if (light.type == "dir") {
					return new xeogl.DirLight(_this7.scene, light.params);
				} else if (light.type == "point") {
					return new xeogl.PointLight(_this7.scene, light.params);
				} else {
					console.log("Unknown light type: " + light.type);
				}
			});
		}

		/**
   *
   * @param params
   * @param ok
   */

	}, {
		key: 'viewFit',
		value: function viewFit(params, ok) {
			var _this8 = this;

			params = params || {};

			var ids = params.ids;
			var aabb = void 0;

			if (!ids || ids.length === 0) {

				// Fit everything in view by default
				aabb = this.scene.worldBoundary.aabb;
			} else {
				aabb = this.getObjectsAABB(ids);
			}

			if (params.animate) {

				this.cameraFlight.flyTo({
					aabb: aabb,
					fitFOV: params.fitFOV,
					duration: params.duration
				}, function () {
					if (ok) {
						ok();
					}

					// Now orbiting the point we flew to
					_this8.cameraControl.rotatePos = _this8.camera.view.look;
				});
			} else {

				this.cameraFlight.jumpTo({
					aabb: aabb,
					fitFOV: 50.0
				});
			}
		}

		// Updates the boundary helper

	}, {
		key: 'setBoundaryState',
		value: function setBoundaryState(params) {

			if (params.aabb) {
				throw new Error("Not supported");
			} else if (params.ids) {
				this.boundaryHelper.setSelected(params.ids);

				this.highlightEffect.clear();

				var ids = params.ids;
				var objectId = void 0;
				var object = void 0;

				for (var i = 0, len = ids.length; i < len; i++) {
					objectId = ids[i];
					object = this.objects[objectId];
					if (object) {

						this.highlightEffect.add(object);
						//object.highlighted = true;
					}
				}
			}
		}

		// Returns an axis-aligned bounding box (AABB) that encloses the given objects

	}, {
		key: 'getObjectsAABB',
		value: function getObjectsAABB(ids_) {
			var _this9 = this;

			var ids = void 0;
			if (Object.keys(this.objects_by_guid).length) {
				ids = [];
				ids_.forEach(function (i) {
					_this9.objects_by_guid[i].forEach(function (o) {
						ids.push(o.id);
					});
				});
			} else {
				ids = ids_;
			}

			if (ids.length === 0) {

				// No object IDs given
				return null;
			}

			var objectId = void 0;
			var object = void 0;
			var worldBoundary = void 0;

			if (ids.length === 1) {

				// One object ID given

				objectId = ids[0];
				object = this.objects[objectId] || this.objects_by_guid[objectId];

				if (object) {
					worldBoundary = object.worldBoundary;

					if (worldBoundary) {

						return worldBoundary.aabb;
					} else {
						return null;
					}
				} else {
					return null;
				}
			}

			// Many object IDs given

			var i = void 0;
			var len = void 0;
			var min = void 0;
			var max = void 0;

			var xmin = 100000;
			var ymin = 100000;
			var zmin = 100000;
			var xmax = -100000;
			var ymax = -100000;
			var zmax = -100000;

			var aabb = void 0;

			for (i = 0, len = ids.length; i < len; i++) {

				objectId = ids[i];
				object = this.objects[objectId] || this.objects_by_guid[objectId];

				if (!object) {
					continue;
				}

				worldBoundary = object.worldBoundary;

				if (!worldBoundary) {
					continue;
				}

				aabb = worldBoundary.aabb;

				min = aabb.slice(0);
				max = aabb.slice(3);

				if (min[0] < xmin) {
					xmin = min[0];
				}

				if (min[1] < ymin) {
					ymin = min[1];
				}

				if (min[2] < zmin) {
					zmin = min[2];
				}

				if (max[0] > xmax) {
					xmax = max[0];
				}

				if (max[1] > ymax) {
					ymax = max[1];
				}

				if (max[2] > zmax) {
					zmax = max[2];
				}
			}

			var result = xeogl.math.AABB3();

			result[0 + 0] = xmin;
			result[1 + 0] = ymin;
			result[2 + 0] = zmin;
			result[0 + 3] = xmax;
			result[1 + 3] = ymax;
			result[2 + 3] = zmax;

			return result;
		}

		/**
   * Remembers the current state of the viewer so that it can be reset to this state with
   * a subsequent call to #reset.
   */

	}, {
		key: 'saveReset',
		value: function saveReset() {
			this.resetBookmark = this.getBookmark();
		}
	}, {
		key: 'getObject',
		value: function getObject(id) {
			return this.objects[id];
		}

		/**
   * Resets the state of this viewer to the state previously saved with #saveReset.
   * @param {*} params A mask which specifies which aspects of viewer state to reset.
   */

	}, {
		key: 'reset',
		value: function reset(params) {
			if (!this.resetBookmark) {
				console.log("Ignoring call to xeoViewer.reset - xeoViewer.saveReset not called previously.");
				return;
			}
			this.setBookmark(this.resetBookmark, params);
		}

		/**
   * Returns a bookmark of xeoViewer state.
   * @param {*} options A mask which specifies which aspects of viewer state to bookmark.
   */

	}, {
		key: 'getBookmark',
		value: function getBookmark(options) {

			// Get everything by default

			var getVisible = !options || options.visible;
			var getColors = !options || options.colors;
			var getSelected = !options || options.selected;
			var getCamera = !options || options.camera;

			var bookmark = {};

			var objectId = void 0;
			var object = void 0;

			if (getVisible) {

				var visible = [];

				for (objectId in this.objects) {
					if (this.objects.hasOwnProperty(objectId)) {

						object = this.objects[objectId] || this.objects_by_guid[objectId];

						if (getVisible && object.visibility.visible) {
							visible.push(objectId);
						}
					}
				}
				bookmark.visible = visible;
			}

			if (getColors) {

				var colors = {};
				var opacities = {};

				for (objectId in this.objects) {
					if (this.objects.hasOwnProperty(objectId)) {
						object = this.objects[objectId] || this.objects_by_guid[objectId];
						colors[objectId] = object.material.diffuse.slice(); // RGB
						opacities[objectId] = object.modes.transparent ? object.material.opacity : 1.0;
					}
				}
				bookmark.colors = colors;
				bookmark.opacities = opacities;
			}

			if (getSelected) {
				bookmark.selected = this.getSelection();
			}

			if (getCamera) {
				var camera = this.getCamera();
				camera.animate = true; // Camera will fly to position when bookmark is restored
				bookmark.camera = camera;
			}

			return bookmark;
		}

		/**
   * Restores xeoViewer to a bookmark.
   *
   * @param bookmark
   * @param options
   */

	}, {
		key: 'setBookmark',
		value: function setBookmark(bookmark, options) {

			// Set everything by default, where provided in bookmark

			var setVisible = bookmark.visible && (!options || options.visible);
			var setColors = bookmark.colors && (!options || options.colors);
			var setSelected = bookmark.selected && (!options || options.selected);
			var setCamera = bookmark.camera && (!options || options.camera);

			if (setColors) {

				var objectId = void 0;
				var object = void 0;
				var colors = bookmark.colors;
				var opacities = bookmark.opacities;

				for (objectId in colors) {
					if (colors.hasOwnProperty(objectId)) {
						object = this.objects[objectId] || this.objects_by_guid[objectId];
						if (object) {
							this._setObjectColor(object, colors[objectId]);
							this._setObjectOpacity(object, opacities[objectId]);
						}
					}
				}
			}

			if (setVisible) {
				this.setVisibility({
					ids: bookmark.visible,
					visible: true
				});
			}

			if (setSelected) {
				this.setSelection({
					ids: bookmark.selected,
					selected: true
				});
			}

			if (setCamera) {
				this.setCamera(bookmark.camera);
			}
		}

		/**
   * Sets general configurations.
   *
   * @param params
   * @param {Boolean} [params.mouseRayPick=true] When true, camera flies to orbit each clicked point, otherwise
   * it flies to the boundary of the object that was clicked on.
   * @param [params.viewFitFOV=25] {Number} How much of field-of-view, in degrees, that a target {{#crossLink "Entity"}}{{/crossLink}} or its AABB should
   * fill the canvas when calling {{#crossLink "CameraFlightAnimation/flyTo:method"}}{{/crossLink}} or {{#crossLink "CameraFlightAnimation/jumpTo:method"}}{{/crossLink}}.
   * @param [params.viewFitDuration=1] {Number} Flight duration, in seconds, when calling {{#crossLink "CameraFlightAnimation/flyTo:method"}}{{/crossLink}}.
   */

	}, {
		key: 'setConfigs',
		value: function setConfigs(params) {

			params = params || {};

			if (params.mouseRayPick != undefined) {
				this.cameraControl.mousePickEntity.rayPick = params.mouseRayPick;
			}

			if (params.viewFitFOV != undefined) {
				this.cameraFlight.fitFOV = params.viewFitFOV;
			}

			if (params.viewFitDuration != undefined) {
				this.cameraFlight.duration = params.viewFitDuration;
			}
		}

		/**
   Returns a snapshot of this xeoViewer as a Base64-encoded image.
  	
   #### Usage:
   ````javascript
   imageElement.src = xeoViewer.getSnapshot({
  	 width: 500, // Defaults to size of canvas
  	 height: 500,
  	 format: "png" // Options are "jpeg" (default), "png" and "bmp"
   });
   ````
  	
   @method getSnapshot
   @param {*} [params] Capture options.
   @param {Number} [params.width] Desired width of result in pixels - defaults to width of canvas.
   @param {Number} [params.height] Desired height of result in pixels - defaults to height of canvas.
   @param {String} [params.format="jpeg"] Desired format; "jpeg", "png" or "bmp".
   @returns {String} String-encoded image data.
   */

	}, {
		key: 'getSnapshot',
		value: function getSnapshot(params) {
			return this.scene.canvas.getSnapshot(params);
		}

		/**
   Returns a list of loaded IFC entity types in the model.
  	
   @method getTypes
   @returns {Array} List of loaded IFC entity types, with visibility flag
   */

	}, {
		key: 'getTypes',
		value: function getTypes() {
			var _this10 = this;

			return Object.keys(this.rfcTypes).map(function (n) {
				return { name: n, visible: _this10.hiddenTypes.indexOf(n) === -1 };
			});
		}

		/**
   * Returns the world boundary of an object
   *
   * @method getWorldBoundary
   * @param {String} objectId id of object
   * @param {Object} result Existing boundary object
   * @returns {Object} World boundary of object, containing {obb, aabb, center, sphere} properties. See xeogl.Boundary3D
   */

	}, {
		key: 'getWorldBoundary',
		value: function getWorldBoundary(objectId, result) {
			var object = this.objects[objectId] || this.objects_by_guid[objectId];

			if (object === undefined) {
				return null;
			} else {
				if (result === undefined) {
					result = {
						obb: new Float32Array(32),
						aabb: new Float32Array(6),
						center: xeogl.math.vec3(),
						sphere: xeogl.math.vec4()
					};
				}

				// the boundary needs to be scaled back to real world units
				var s = 1 / this.scale.xyz[0],
				    scaled = object.worldBoundary;

				result.aabb[0] = scaled.aabb[0] * s;
				result.aabb[1] = scaled.aabb[1] * s;
				result.aabb[2] = scaled.aabb[2] * s;
				result.aabb[3] = scaled.aabb[3] * s;
				result.aabb[4] = scaled.aabb[4] * s;
				result.aabb[5] = scaled.aabb[5] * s;

				xeogl.math.mulVec3Scalar(scaled.center, s, result.center);
				xeogl.math.mulVec4Scalar(scaled.sphere, s, result.sphere);

				var obb = scaled.obb;
				var buffer = result.obb.buffer;
				for (var i = 0; i < 32; i += 4) {
					var v = new Float32Array(buffer, 4 * i);
					xeogl.math.mulVec3Scalar(obb.slice(i), s, v);
					v[3] = 1.0;
				}

				return result;
			}
		}

		/**
   * Destroys the viewer
   */

	}, {
		key: 'destroy',
		value: function destroy() {
			this.scene.destroy();
		}
	}]);
	return xeoViewer;
}(EventHandler);

var BimSurfer = function (_EventHandler) {
	inherits(BimSurfer, _EventHandler);

	function BimSurfer(cfg) {
		classCallCheck(this, BimSurfer);

		var _this = possibleConstructorReturn(this, (BimSurfer.__proto__ || Object.getPrototypeOf(BimSurfer)).call(this));

		_this.BimServerApi = BimServerClient;

		cfg = cfg || {};

		_this.viewer = new xeoViewer(cfg);

		/**
   * Fired whenever this BIMSurfer's camera changes.
   * @event camera-changed
   */
		_this.viewer.on("camera-changed", function (args) {
			_this.fire("camera-changed", args);
		});

		/**
   * Fired whenever this BIMSurfer's selection changes.
   * @event selection-changed
   */
		_this.viewer.on("selection-changed", function (args) {
			_this.fire("selection-changed", args);
		});

		// This are arrays as multiple models might be loaded or unloaded.
		_this._idMapping = {
			'toGuid': [],
			'toId': []
		};
		return _this;
	}
	/**
  * Loads a model into this BIMSurfer.
  * @param params
  */


	createClass(BimSurfer, [{
		key: 'load',
		value: function load(params) {

			if (params.test) {
				this.viewer.loadRandom(params);
				return null;
			} else if (params.bimserver) {
				return this._loadFromServer(params);
			} else if (params.api) {
				return this._loadFromAPI(params);
			} else if (params.src) {
				return this._loadFrom_glTF(params);
			}
		}
	}, {
		key: '_loadFromServer',
		value: function _loadFromServer(params) {

			var notifier = new Notifier();
			var bimServerApi = new this.BimServerApi(params.bimserver, notifier);

			params.api = bimServerApi; // TODO: Make copy of params

			return this._initApi(params).then(this._loginToServer).then(this._getRevisionFromServer.bind(this)).then(this._loadFromAPI.bind(this));
		}
	}, {
		key: '_initApi',
		value: function _initApi(params) {
			return new Promise(function (resolve, reject) {
				params.api.init(function () {
					resolve(params);
				});
			});
		}
	}, {
		key: '_loginToServer',
		value: function _loginToServer(params) {
			return new Promise(function (resolve, reject) {
				if (params.token) {
					params.api.setToken(params.token, function () {
						resolve(params);
					}, reject);
				} else {
					params.api.login(params.username, params.password, function () {
						resolve(params);
					}, reject);
				}
			});
		}
	}, {
		key: '_getRevisionFromServer',
		value: function _getRevisionFromServer(params) {
			var _this2 = this;

			return new Promise(function (resolve, reject) {
				if (params.roid) {
					resolve(params);
				} else {
					params.api.call("ServiceInterface", "getAllRelatedProjects", { poid: params.poid }, function (data) {
						var resolved = false;

						data.forEach(function (projectData) {
							if (projectData.oid == params.poid) {
								params.roid = projectData.lastRevisionId;
								params.schema = projectData.schema;
								if (!_this2.models) {
									_this2.models = [];
								}
								_this2.models.push(projectData);
								resolved = true;
								resolve(params);
							}
						});

						if (!resolved) {
							reject();
						}
					}, reject);
				}
			});
		}
	}, {
		key: '_loadFrom_glTF',
		value: function _loadFrom_glTF(params) {
			var _this3 = this;

			if (params.src) {
				return new Promise(function (resolve, reject) {
					var m = _this3.viewer.loadglTF(params.src);
					m.on("loaded", function () {

						var numComponents = 0,
						    componentsLoaded = 0;

						m.iterate(function (component) {
							if (component.isType("xeogl.Entity")) {
								++numComponents;
								(function (c) {
									var timesUpdated = 0;
									c.worldBoundary.on("updated", function () {
										if (++timesUpdated == 2) {
											++componentsLoaded;
											if (componentsLoaded == numComponents) {
												_this3.viewer.viewFit({});

												resolve(m);
											}
										}
									});
								})(component);
							}
						});
					});
				});
			}
		}
	}, {
		key: '_loadFromAPI',
		value: function _loadFromAPI(params) {
			var _this4 = this;

			return new Promise(function (resolve, reject) {

				params.api.getModel(params.poid, params.roid, params.schema, false, function (model) {

					// TODO: Preload not necessary combined with the bruteforce tree
					var fired = false;

					model.query(PreloadQuery, function () {
						if (!fired) {
							fired = true;
							var vmodel = new BimServerModel(params.api, model);

							_this4._loadModel(vmodel);

							resolve(vmodel);
						}
					});
				});
			});
		}
	}, {
		key: '_loadModel',
		value: function _loadModel(model) {
			var _this5 = this;

			model.getTree().then(function (tree) {

				var oids = [];
				var oidToGuid = {};
				var guidToOid = {};

				var visit = function visit(n) {
					oids[n.gid] = n.id;
					oidToGuid[n.id] = n.guid;
					guidToOid[n.guid] = n.id;

					for (var i = 0; i < (n.children || []).length; ++i) {
						visit(n.children[i]);
					}
				};

				visit(tree);

				_this5._idMapping.toGuid.push(oidToGuid);
				_this5._idMapping.toId.push(guidToOid);

				var models = {};

				// TODO: Ugh. Undecorate some of the newly created classes
				models[model.model.roid] = model.model;

				// Notify viewer that things are loading, so viewer can
				// reduce rendering speed and show a spinner.
				_this5.viewer.taskStarted();

				_this5.viewer.createModel(model.model.roid);

				var loader = new BimServerGeometryLoader(model.api, models, _this5.viewer);

				loader.addProgressListener(function (progress, nrObjectsRead, totalNrObjects) {
					if (progress == "start") {
						console.log("Started loading geometries");
						_this5.fire("loading-started");
					} else if (progress == "done") {
						console.log("Finished loading geometries (" + totalNrObjects + " objects received)");
						_this5.fire("loading-finished");
						_this5.viewer.taskFinished();
					}
				});

				loader.setLoadOids([model.model.roid], oids);

				// viewer.clear(); // For now, until we support multiple models through the API

				_this5.viewer.on("tick", function () {
					// TODO: Fire "tick" event from xeoViewer
					loader.process();
				});

				loader.start();
			});
		}

		// Helper function to traverse over the mappings for individually loaded models

	}, {
		key: 'toId',


		/**
   * Returns a list of object ids (oid) for the list of guids (GlobalId)
   *
   * @param guids List of globally unique identifiers from the IFC model
   */
		value: function toId(guids) {
			return guids.map(this._traverseMappings(this._idMapping.toId));
		}

		/**
   * Returns a list of guids (GlobalId) for the list of object ids (oid) 
   *
   * @param ids List of internal object ids from the BIMserver / glTF file
   */

	}, {
		key: 'toGuid',
		value: function toGuid(ids) {
			return ids.map(this._traverseMappings(this._idMapping.toGuid));
		}

		/**
   * Shows/hides objects specified by id or entity type, e.g IfcWall.
   *
   * When recursive is set to true, hides children (aggregates, spatial structures etc) or
   * subtypes (IfcWallStandardCase ⊆ IfcWall).
   *
   * @param params
   */

	}, {
		key: 'setVisibility',
		value: function setVisibility(params) {
			this.viewer.setVisibility(params);
		}

		/**
   * Selects/deselects objects specified by id.
   **
   * @param params
   */

	}, {
		key: 'setSelection',
		value: function setSelection(params) {
			return this.viewer.setSelection(params);
		}

		/**
   * Gets a list of selected elements.
   */

	}, {
		key: 'getSelection',
		value: function getSelection() {
			return this.viewer.getSelection();
		}

		/**
   * Sets color of objects specified by ids or entity type, e.g IfcWall.
   **
   * @param params
   */

	}, {
		key: 'setColor',
		value: function setColor(params) {
			this.viewer.setColor(params);
		}

		/**
   * Sets opacity of objects specified by ids or entity type, e.g IfcWall.
   **
   * @param params
   */

	}, {
		key: 'setOpacity',
		value: function setOpacity(params) {
			this.viewer.setOpacity(params);
		}

		/**
   * Fits the elements into view.
   *
   * Fits the entire model into view if ids is an empty array, null or undefined.
   * Animate allows to specify a transition period in milliseconds in which the view is altered.
   *
   * @param params
   */

	}, {
		key: 'viewFit',
		value: function viewFit(params) {
			this.viewer.viewFit(params);
		}

		/**
   *
   */

	}, {
		key: 'getCamera',
		value: function getCamera() {
			return this.viewer.getCamera();
		}

		/**
   *
   * @param params
   */

	}, {
		key: 'setCamera',
		value: function setCamera(params) {
			this.viewer.setCamera(params);
		}

		/**
   * Redefines light sources.
   * 
   * @param params Array of lights {type: "ambient"|"dir"|"point", params: {[...]}}
   * See http://xeoengine.org/docs/classes/Lights.html for possible params for each light type
   */

	}, {
		key: 'setLights',
		value: function setLights(params) {
			this.viewer.setLights(params);
		}

		/**
   * Returns light sources.
   * 
   * @returns Array of lights {type: "ambient"|"dir"|"point", params: {[...]}}
   */

	}, {
		key: 'getLights',
		value: function getLights() {
			return this.viewer.getLights;
		}

		/**
   *
   * @param params
   */

	}, {
		key: 'reset',
		value: function reset(params) {
			this.viewer.reset(params);
		}

		/**
   * Returns a list of loaded IFC entity types in the model.
   * 
   * @method getTypes
   * @returns {Array} List of loaded IFC entity types, with visibility flag
   */

	}, {
		key: 'getTypes',
		value: function getTypes() {
			return this.viewer.getTypes();
		}

		/**
   * Sets the default behaviour of mouse and touch drag input
   *
   * @method setDefaultDragAction
   * @param {String} action ("pan" | "orbit")
   */

	}, {
		key: 'setDefaultDragAction',
		value: function setDefaultDragAction(action) {
			this.viewer.setDefaultDragAction(action);
		}

		/**
   * Returns the world boundary of an object
   *
   * @method getWorldBoundary
   * @param {String} objectId id of object
   * @param {Object} result Existing boundary object
   * @returns {Object} World boundary of object, containing {obb, aabb, center, sphere} properties. See xeogl.Boundary3D
   */

	}, {
		key: 'getWorldBoundary',
		value: function getWorldBoundary(objectId, result) {
			return this.viewer.getWorldBoundary(objectId, result);
		}

		/**
    * Destroys the BIMSurfer
    */

	}, {
		key: 'destroy',
		value: function destroy() {
			this.viewer.destroy();
		}
	}], [{
		key: '_traverseMappings',
		value: function _traverseMappings(mappings) {
			return function (k) {
				for (var i = 0; i < mappings.length; ++i) {
					var v = mappings[i][k];
					if (v) {
						return v;
					}
				}
				return null;
			};
		}
	}]);
	return BimSurfer;
}(EventHandler);

var BimServerModelLoader = function () {

	//define(["./BimServerModel", "./PreloadQuery", "./BimServerGeometryLoader", "./BimSurfer"], function(BimServerModel, PreloadQuery, BimServerGeometryLoader, BimSufer) { 

	function BimServerModelLoader(bimServerClient, bimSurfer) {
		classCallCheck(this, BimServerModelLoader);

		this.bimServerClient = bimServerClient;
		this.bimSurfer = bimSurfer;
		this.globalTransformationMatrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
	}

	createClass(BimServerModelLoader, [{
		key: 'loadFullModel',
		value: function loadFullModel(apiModel) {
			var _this = this;

			return new Promise(function (resolve, reject) {
				var model = new BimServerModel(apiModel);

				apiModel.query(PreloadQuery, function () {}).done(function () {
					var oids = [];
					apiModel.getAllOfType("IfcProduct", true, function (object) {
						oids.push(object.oid);
					});
					_this.loadOids(model, oids);
					resolve(model);
				});
			});
		}
	}, {
		key: 'loadObjects',
		value: function loadObjects(apiModel, objects) {
			var _this2 = this;

			return new Promise(function (resolve, reject) {
				var model = new BimServerModel(apiModel);

				var oids = [];
				objects.forEach(function (object) {
					oids.push(object.oid);
				});
				_this2.loadOids(model, oids);
				resolve(model);
			});
		}
	}, {
		key: 'loadOids',
		value: function loadOids(model, oids) {
			var _this3 = this;

			var oidToGuid = {};
			var guidToOid = {};

			var oidGid = {};

			oids.forEach(function (oid) {
				model.apiModel.get(oid, function (object) {
					if (object.object._rgeometry != null) {
						var gid = object.object._rgeometry; //._i;
						var guid = object.object.GlobalId;
						oidToGuid[oid] = guid;
						guidToOid[guid] = oid;
						oidGid[gid] = oid;
					}
				});
			});

			this.bimSurfer._idMapping.toGuid.push(oidToGuid);
			this.bimSurfer._idMapping.toId.push(guidToOid);

			var viewer = this.bimSurfer.viewer;
			viewer.taskStarted();

			viewer.createModel(model.apiModel.roid);

			var loader = new BimServerGeometryLoader(model.apiModel.bimServerApi, viewer, model, model.apiModel.roid, this.globalTransformationMatrix);

			loader.addProgressListener(function (progress, nrObjectsRead, totalNrObjects) {
				if (progress == "start") {
					console.log("Started loading geometries");
					_this3.bimSurfer.fire("loading-started");
				} else if (progress == "done") {
					console.log("Finished loading geometries (" + totalNrObjects + " objects received)");
					_this3.bimSurfer.fire("loading-finished");
					viewer.taskFinished();
				}
			});

			loader.setLoadOids(oidGid);

			// viewer.clear(); // For now, until we support multiple models through the API

			viewer.on("tick", function () {
				// TODO: Fire "tick" event from xeoViewer
				loader.process();
			});

			loader.start();
		}
	}, {
		key: 'setGlobalTransformationMatrix',
		value: function setGlobalTransformationMatrix(globalTransformationMatrix) {
			this.globalTransformationMatrix = globalTransformationMatrix;
		}
	}]);
	return BimServerModelLoader;
}();

function make(args) {
	return new Promise(function (resolve, reject) {
		var xhr = new XMLHttpRequest();
		xhr.open(args.method || "GET", args.url, true);
		xhr.onload = function (e) {
			console.log(args.url, xhr.readyState, xhr.status);
			if (xhr.readyState === 4) {
				if (xhr.status === 200) {
					resolve(xhr.responseXML);
				} else {
					reject(xhr.statusText);
				}
			}
		};
		xhr.send(null);
	});
}

var StaticTreeRenderer = function (_EventHandler) {
	inherits(StaticTreeRenderer, _EventHandler);

	function StaticTreeRenderer(args) {
		classCallCheck(this, StaticTreeRenderer);

		var _this = possibleConstructorReturn(this, (StaticTreeRenderer.__proto__ || Object.getPrototypeOf(StaticTreeRenderer)).call(this));

		_this.args = args;
		_this.TOGGLE = 0;
		_this.SELECT = 1;
		_this.SELECT_EXCLUSIVE = 2;
		_this.DESELECT = 3;

		_this.fromXml = false;

		_this.domNodes = {};
		_this.selectionState = {};
		_this.models = [];
		return _this;
	}

	createClass(StaticTreeRenderer, [{
		key: 'getOffset',
		value: function getOffset(elem) {
			var reference = document.getElementById(this.args.domNode);
			var y = 0;

			while (true) {
				y += elem.offsetTop;
				if (elem == reference) {
					break;
				}
				elem = elem.offsetParent;
			}
			return y;
		}
	}, {
		key: 'setSelected',
		value: function setSelected(ids, mode) {
			var _this2 = this;

			if (mode == this.SELECT_EXCLUSIVE) {
				this.setSelected(this.getSelected(true), this.DESELECT);
			}

			ids.forEach(function (id) {
				var s = null;

				if (mode == _this2.TOGGLE) {
					s = _this2.selectionState[id] = !_this2.selectionState[id];
				} else if (mode == _this2.SELECT || mode == _this2.SELECT_EXCLUSIVE) {
					s = _this2.selectionState[id] = true;
				} else if (mode == _this2.DESELECT) {
					s = _this2.selectionState[id] = false;
				}

				_this2.domNodes[id].className = s ? "label selected" : "label";
			});

			var desiredViewRange = this.getSelected().map(function (id) {
				return _this2.getOffset(_this2.domNodes[id]);
			});

			if (desiredViewRange.length) {
				desiredViewRange.sort();
				desiredViewRange = [desiredViewRange[0], desiredViewRange[desiredViewRange.length - 1]];

				var domNode = document.getElementById(this.args.domNode);
				var currentViewRange = [domNode.scrollTop, domNode.scrollTop + domNode.offsetHeight];

				if (!(desiredViewRange[0] >= currentViewRange[0] && desiredViewRange[1] <= currentViewRange[1])) {
					if (desiredViewRange[1] - desiredViewRange[0] > currentViewRange[1] - currentViewRange[0]) {
						domNode.scrollTop = desiredViewRange[0];
					} else {
						var l = parseInt((desiredViewRange[1] + desiredViewRange[0]) / 2.0 - (currentViewRange[1] - currentViewRange[0]) / 2.0, 10);

						l = Math.max(l, 0);
						l = Math.min(l, domNode.scrollHeight - domNode.offsetHeight);
						domNode.scrollTop = l;
					}
				}
			}

			this.fire("selection-changed", [this.getSelected(true)]);
		}
	}, {
		key: 'getSelected',
		value: function getSelected(b) {
			var _this3 = this;

			b = typeof b === 'undefined' ? true : !!b;
			var l = [];
			Object.keys(this.selectionState).forEach(function (k) {
				if (!!_this3.selectionState[k] === b) {
					l.push(k);
				}
			});
			return l;
		}
	}, {
		key: 'addModel',
		value: function addModel(args) {
			this.models.push(args);
			if (args.src) {
				this.fromXml = true;
			}
		}
	}, {
		key: 'qualifyInstance',
		value: function qualifyInstance(modelId, id) {
			if (this.fromXml) {
				return id;
			} else {
				return modelId + ":" + id;
			}
		}
	}, {
		key: 'build',
		value: function build() {
			var _this4 = this;

			var build = function build(modelId, d, n) {
				var qid = _this4.qualifyInstance(modelId, _this4.fromXml ? n.guid : n.id);
				var label = document.createElement("div");
				var children = document.createElement("div");

				label.className = "label";
				label.appendChild(document.createTextNode(n.name || n.guid));
				d.appendChild(label);
				children.className = "children";
				d.appendChild(children);
				_this4.domNodes[qid] = label;

				label.onclick = function (evt) {
					evt.stopPropagation();
					evt.preventDefault();
					_this4.setSelected([qid], evt.shiftKey ? _this4.TOGGLE : _this4.SELECT_EXCLUSIVE);
					_this4.fire("click", [qid, _this4.getSelected(true)]);
					return false;
				};

				for (var _i = 0; _i < (n.children || []).length; ++_i) {
					var child = n.children[_i];
					if (_this4.fromXml) {
						if (child["xlink:href"]) {
							continue;
						}
						if (child.type === "IfcOpeningElement") {
							continue;
						}
					}
					var d2 = document.createElement("div");
					d2.className = "item";
					children.appendChild(d2);
					build(modelId, d2, child);
				}
			};

			this.models.forEach(function (m) {
				var d = document.createElement("div");
				d.className = "item";
				if (m.tree) {
					build(m.id, d, m.tree);
				} else if (m.src) {
					make({ url: m.src }).then(function (xml) {
						var json = Utils.XmlToJson(xml, { 'Name': 'name', 'id': 'guid' });
						var project = Utils.FindNodeOfType(json.children[0], "decomposition")[0].children[0];
						build(m.id || i, d, project);
					});
				}
				document.getElementById(_this4.args.domNode).appendChild(d);
			});
		}
	}]);
	return StaticTreeRenderer;
}(EventHandler);

var Row = function () {
	function Row(args) {
		classCallCheck(this, Row);

		this.args = args;
		this.num_names = 0;
		this.num_values = 0;
	}

	createClass(Row, [{
		key: 'setName',
		value: function setName(name) {
			if (this.num_names++ > 0) {
				this.args.name.appendChild(document.createTextNode(" "));
			}
			this.args.name.appendChild(document.createTextNode(name));
		}
	}, {
		key: 'setValue',
		value: function setValue(value) {
			if (this.num_values++ > 0) {
				this.args.value.appendChild(document.createTextNode(", "));
			}
			this.args.value.appendChild(document.createTextNode(value));
		}
	}]);
	return Row;
}();

var Section = function () {
	function Section(args) {
		classCallCheck(this, Section);

		this.args = args;

		this.div = document.createElement("div");
		this.nameh = document.createElement("h3");
		this.table = document.createElement("table");

		this.tr = document.createElement("tr");
		this.table.appendChild(this.tr);

		this.nameth = document.createElement("th");
		this.valueth = document.createElement("th");

		this.nameth.appendChild(document.createTextNode("Name"));
		this.valueth.appendChild(document.createTextNode("Value"));
		this.tr.appendChild(this.nameth);
		this.tr.appendChild(this.valueth);

		this.div.appendChild(this.nameh);
		this.div.appendChild(this.table);

		args.domNode.appendChild(this.div);

		this.setSelected([]);
	}

	createClass(Section, [{
		key: 'setName',
		value: function setName(name) {
			this.nameh.appendChild(document.createTextNode(name));
		}
	}, {
		key: 'addRow',
		value: function addRow() {
			var tr = document.createElement("tr");
			this.table.appendChild(tr);
			var nametd = document.createElement("td");
			var valuetd = document.createElement("td");
			tr.appendChild(nametd);
			tr.appendChild(valuetd);
			return new Row({ name: nametd, value: valuetd });
		}
	}]);
	return Section;
}();

function loadModelFromSource(src) {
	return new Promise(function (resolve, reject) {
		make({ url: src }).then(function (xml) {
			var json = Utils.XmlToJson(xml, { 'Name': 'name', 'id': 'guid' });

			var psets = Utils.FindNodeOfType(json, "properties")[0];
			var project = Utils.FindNodeOfType(json, "decomposition")[0].children[0];
			var types = Utils.FindNodeOfType(json, "types")[0];

			var objects = {};
			var typeObjects = {};
			var properties = {};
			psets.children.forEach(function (pset) {
				properties[pset.guid] = pset;
			});

			var visitObject = function visitObject(parent, node) {
				var o = parent && parent.ObjectPlacement ? objects : typeObjects;

				if (node["xlink:href"]) {
					if (!o[parent.guid]) {
						var _p = Utils.Clone(parent);
						_p.GlobalId = _p.guid;
						o[_p.guid] = _p;
						o[_p.guid].properties = [];
					}
					var g = node["xlink:href"].substr(1);
					var p = properties[g];
					if (p) {
						o[parent.guid].properties.push(p);
					} else if (typeObjects[g]) {
						// If not a pset, it is a type, so concatenate type props
						o[parent.guid].properties = o[parent.guid].properties.concat(typeObjects[g].properties);
					}
				}
				node.children.forEach(function (n) {
					visitObject(node, n);
				});
			};

			visitObject(null, types);
			visitObject(null, project);

			resolve({ model: { objects: objects, source: 'XML' } });
		});
	});
}

var MetaDataRenderer = function (_EventHandler) {
	inherits(MetaDataRenderer, _EventHandler);

	function MetaDataRenderer(args) {
		classCallCheck(this, MetaDataRenderer);

		var _this = possibleConstructorReturn(this, (MetaDataRenderer.__proto__ || Object.getPrototypeOf(MetaDataRenderer)).call(this));

		_this.args = args;

		_this.models = {};
		_this.domNode = document.getElementById(_this.args.domNode);
		return _this;
	}

	createClass(MetaDataRenderer, [{
		key: 'addModel',
		value: function addModel(args) {
			var _this2 = this;

			return new Promise(function (resolve, reject) {
				if (args.model) {
					_this2.models[args.id] = args.model;
					resolve(args.model);
				} else {
					loadModelFromSource(args.src).then(function (m) {
						_this2.models[args.id] = m;
						resolve(m);
					});
				}
			});
		}
	}, {
		key: 'renderAttributes',
		value: function renderAttributes(elem) {
			var s = new Section({ domNode: this.domNode });
			s.setName(elem.type || elem.getType());

			["GlobalId", "Name", "OverallWidth", "OverallHeight", "Tag"].forEach(function (k) {
				var v = elem[k];
				if (typeof v === 'undefined') {
					var fn = elem["get" + k];
					if (fn) {
						v = fn.apply(elem);
					}
				}
				if (typeof v !== 'undefined') {
					var r = s.addRow();
					r.setName(k);
					r.setValue(v);
				}
			});
			return s;
		}
	}, {
		key: 'renderPSet',
		value: function renderPSet(pset) {
			var s = new Section({ domNode: this.domNode });
			if (pset.name && pset.children) {
				s.setName(pset.name);
				pset.children.forEach(function (v) {
					var r = s.addRow();
					r.setName(v.name);
					r.setValue(v.NominalValue);
				});
			} else {
				pset.getName(function (name) {
					s.setName(name);
				});
				var render = function render(prop, index, row) {
					var r = row || s.addRow();
					prop.getName(function (name) {
						r.setName(name);
					});
					if (prop.getNominalValue) {
						prop.getNominalValue(function (value) {
							r.setValue(value._v);
						});
					}
					if (prop.getHasProperties) {
						prop.getHasProperties(function (prop, index) {
							render(prop, index, r);
						});
					}
				};
				pset.getHasProperties(render);
			}
			return s;
		}
	}, {
		key: 'setSelected',
		value: function setSelected(oid) {
			var _this3 = this;

			if (oid.length !== 1) {
				this.domNode.innerHTML = "&nbsp;<br>Select a single element in order to see object properties.";
				return;
			}

			this.domNode.innerHTML = "";

			oid = oid[0];

			if (oid.indexOf(':') !== -1) {
				oid = oid.split(':');
				var o = this.models[oid[0]].model.objects[oid[1]];

				this.renderAttributes(o);

				o.getIsDefinedBy(function (isDefinedBy) {
					if (isDefinedBy.getType() == "IfcRelDefinesByProperties") {
						isDefinedBy.getRelatingPropertyDefinition(function (pset) {
							if (pset.getType() == "IfcPropertySet") {
								_this3.renderPSet(pset);
							}
						});
					}
				});
			} else {
				var _o = this.models["1"].model.objects[oid];
				this.renderAttributes(_o);
				_o.properties.forEach(function (pset) {
					_this3.renderPSet(pset);
				});
			}
		}
	}]);
	return MetaDataRenderer;
}(EventHandler);

exports.BimSurfer = BimSurfer;
exports.BimServerModelLoader = BimServerModelLoader;
exports.StaticTreeRenderer = StaticTreeRenderer;
exports.MetaDataRenderer = MetaDataRenderer;

Object.defineProperty(exports, '__esModule', { value: true });

})));
