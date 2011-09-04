# Additional routines for modifying/manipulating scenejs node attributes

modifySubAttr = (node, attr, subAttr, value) ->
  attrRecord = node.get attr
  attrRecord[subAttr] = value
  node.set attr, attrRecord

