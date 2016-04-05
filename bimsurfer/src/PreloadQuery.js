define({
    defines: {
        Representation: {
            field: "Representation"
        },
        ContainsElementsDefine: {
            field: "ContainsElements",
            include: {
                field: "RelatedElements",
                include: [
                    "IsDecomposedByDefine",
                    "ContainsElementsDefine",
                    "Representation"
                ]
            }
        },
        IsDecomposedByDefine: {
            field: "IsDecomposedBy",
            include: {
                field: "RelatedObjects",
                include: [
                    "IsDecomposedByDefine",
                    "ContainsElementsDefine",
                    "Representation"
                ]
            }
        }
    },
    queries: [
        {
            type: "IfcProject",
            include: [
                "IsDecomposedByDefine",
                "ContainsElementsDefine"
            ]
        },
        {
            type: "IfcRepresentation",
            includeAllSubtypes: true
        },
        {
            type: "IfcProductRepresentation"
        },
        {
            type: "IfcPresentationLayerWithStyle"
        },
        {
            type: "IfcProduct",
            includeAllSubTypes: true
        },
        {
            type: "IfcProductDefinitionShape"
        },
        {
            type: "IfcPresentationLayerAssignment"
        },
        {
            type: "IfcRelAssociatesClassification",
            include: [
                {
                    field: "RelatedObjects"
                },
                {
                    field: "RelatingClassification"
                }
            ]
        },
        {
            type: "IfcSIUnit"
        },
        {
            type: "IfcPresentationLayerAssignment"
        }
    ]
});
