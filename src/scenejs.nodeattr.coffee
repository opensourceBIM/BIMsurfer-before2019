# Additional routines for modifying/manipulating scenejs node attributes

modifySubAttr = (nodeId, attr, subAttr, value) ->
  node = state.scene.findNode nodeId
  attrRecord = node.get attr
  attrRecord[subAttr] = value
  node.set attr, attrRecord

