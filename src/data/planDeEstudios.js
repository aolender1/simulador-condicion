export const planDeEstudios = [
    // AÑO 1 - CUATRIMESTRE 1
    // Agrega tu link de la materia dentro de 'link: ""'. Si está vacío, el botón estará oculto.
    { id: 1, name: "Ciencia, tecnología y sociedad", year: 1, term: 1, link: "http://cargaprogramas.unsl.edu.ar/fmn-programas/public_view.php?p=50595", requirements: { cursar: [], rendir: [] } },
    { id: 2, name: "Introducción al álgebra", year: 1, term: 1, link: "http://cargaprogramas.unsl.edu.ar/fmn-programas/public_view.php?p=47908", requirements: { cursar: [], rendir: [] } },
    { id: 3, name: "Cálculo I", year: 1, term: 1, link: "http://cargaprogramas.unsl.edu.ar/fmn-programas/public_view.php?p=48081", requirements: { cursar: [], rendir: [] } },

    // AÑO 1 - CUATRIMESTRE 2
    {
        id: 4, name: "Álgebra matricial", year: 1, term: 2, link: "http://cargaprogramas.unsl.edu.ar/fmn-programas/public_view.php?p=49751", requirements: {
            cursar: [{ id: 2, state: "regular" }, { id: 3, state: "regular" }], rendir: []
        }
    },
    {
        id: 5, name: "Elementos de Programación", year: 1, term: 2, link: "http://cargaprogramas.unsl.edu.ar/fmn-programas/public_view.php?p=49673", requirements: {
            cursar: [{ id: 2, state: "regular" }], rendir: []
        }
    },
    {
        id: 6, name: "Introducción al análisis y gestión de datos", year: 1, term: 2, link: "http://cargaprogramas.unsl.edu.ar/fmn-programas/public_view.php?p=49726", requirements: {
            cursar: [{ id: 2, state: "regular" }, { id: 3, state: "regular" }], rendir: []
        }
    },

    // AÑO 2 - CUATRIMESTRE 1
    {
        id: 7, name: "Laboratorio de datos", year: 2, term: 1, link: "http://cargaprogramas.unsl.edu.ar/fmn-programas/public_view.php?p=50258", requirements: {
            cursar: [{ id: 5, state: "regular" }, { id: 6, state: "regular" }, { id: 2, state: "aprobada" }, { id: 3, state: "aprobada" }], rendir: []
        }
    },
    {
        id: 8, name: "Probabilidad aplicada", year: 2, term: 1, link: "http://cargaprogramas.unsl.edu.ar/fmn-programas/public_view.php?p=50533", requirements: {
            cursar: [{ id: 5, state: "regular" }, { id: 6, state: "regular" }, { id: 2, state: "aprobada" }, { id: 3, state: "aprobada" }], rendir: []
        }
    },
    {
        id: 9, name: "Modelos paramétricos", year: 2, term: 1, link: "http://cargaprogramas.unsl.edu.ar/fmn-programas/public_view.php?p=47442", requirements: {
            cursar: [{ id: 4, state: "regular" }, { id: 6, state: "regular" }, { id: 2, state: "aprobada" }, { id: 3, state: "aprobada" }], rendir: []
        }
    },
    {
        id: 10, name: "Inglés (Materia anual)", year: 2, term: 1, link: "http://cargaprogramas.unsl.edu.ar/fmn-programas/public_view.php?p=48130", isAnnual: true, requirements: {
            cursar: [{ id: 1, state: "regular" }, { id: 2, state: "regular" }, { id: 3, state: "regular" }], rendir: []
        }
    },

    // AÑO 2 - CUATRIMESTRE 2
    {
        id: 11, name: "Técnicas de muestreo", year: 2, term: 2, link: "http://cargaprogramas.unsl.edu.ar/fmn-programas/public_view.php?p=49376", requirements: {
            cursar: [{ id: 4, state: "regular" }, { id: 6, state: "regular" }, { id: 2, state: "aprobada" }, { id: 3, state: "aprobada" }], rendir: []
        }
    },
    {
        id: 12, name: "Modelos no paramétricos", year: 2, term: 2, link: "http://cargaprogramas.unsl.edu.ar/fmn-programas/public_view.php?p=49731", requirements: {
            cursar: [{ id: 9, state: "regular" }, { id: 4, state: "aprobada" }, { id: 6, state: "aprobada" }], rendir: []
        }
    },
    {
        id: 13, name: "Cálculo II", year: 2, term: 2, link: "http://cargaprogramas.unsl.edu.ar/fmn-programas/public_view.php?p=49881", requirements: {
            cursar: [{ id: 8, state: "regular" }, { id: 2, state: "aprobada" }, { id: 3, state: "aprobada" }], rendir: []
        }
    },
    {
        id: 14, name: "Taller integrador I", year: 2, term: 2, link: "http://cargaprogramas.unsl.edu.ar/fmn-programas/public_view.php?p=49752", requirements: {
            cursar: [{ id: 8, state: "regular" }, { id: 9, state: "regular" }, { id: 4, state: "aprobada" }, { id: 6, state: "aprobada" }], rendir: []
        }
    },

    // AÑO 3 - CUATRIMESTRE 1
    {
        id: 15, name: "Análisis de datos I", year: 3, term: 1, link: "http://cargaprogramas.unsl.edu.ar/fmn-programas/public_view.php?p=47867", requirements: {
            cursar: [{ id: 12, state: "regular" }, { id: 13, state: "regular" }, { id: 8, state: "aprobada" }, { id: 10, state: "aprobada" }], rendir: []
        }
    },
    {
        id: 16, name: "Estimación bayesiana", year: 3, term: 1, link: "http://cargaprogramas.unsl.edu.ar/fmn-programas/public_view.php?p=47866", requirements: {
            cursar: [{ id: 12, state: "regular" }, { id: 13, state: "regular" }, { id: 8, state: "aprobada" }, { id: 9, state: "aprobada" }], rendir: []
        }
    },
    {
        id: 17, name: "Datos categóricos", year: 3, term: 1, link: "http://cargaprogramas.unsl.edu.ar/fmn-programas/public_view.php?p=47862", requirements: {
            cursar: [{ id: 12, state: "regular" }, { id: 13, state: "regular" }, { id: 8, state: "aprobada" }, { id: 9, state: "aprobada" }], rendir: []
        }
    },

    // AÑO 3 - CUATRIMESTRE 2
    {
        id: 18, name: "Análisis de datos II", year: 3, term: 2, link: "http://cargaprogramas.unsl.edu.ar/fmn-programas/public_view.php?p=49826", requirements: {
            cursar: [{ id: 15, state: "regular" }, { id: 17, state: "regular" }, { id: 12, state: "aprobada" }, { id: 13, state: "aprobada" }], rendir: []
        }
    },
    {
        id: 19, name: "Modelos y simulación", year: 3, term: 2, link: "http://cargaprogramas.unsl.edu.ar/fmn-programas/public_view.php?p=49853", requirements: {
            cursar: [{ id: 5, state: "regular" }, { id: 13, state: "regular" }, { id: 12, state: "aprobada" }, { id: 14, state: "aprobada" }], rendir: []
        }
    },
    {
        id: 20, name: "Taller integrador II", year: 3, term: 2, link: "http://cargaprogramas.unsl.edu.ar/fmn-programas/public_view.php?p=49827", requirements: {
            cursar: [{ id: 15, state: "regular" }, { id: 17, state: "regular" }, { id: 12, state: "aprobada" }, { id: 13, state: "aprobada" }], rendir: []
        }
    },

    // AÑO 4 - CUATRIMESTRE 1
    {
        id: 21, name: "Descripción y modelización de datos", year: 4, term: 1, link: "", requirements: {
            cursar: [{ id: 15, state: "aprobada" }, { id: 17, state: "aprobada" }, { id: 18, state: "regular" }, { id: 19, state: "regular" }],
            rendir: [{ id: 18, state: "aprobada" }, { id: 19, "state": "aprobada" }]
        }
    },
    {
        id: 22, name: "Análisis multivariado", year: 4, term: 1, link: "", requirements: {
            cursar: [{ id: 15, state: "aprobada" }, { id: 17, state: "aprobada" }, { id: 18, state: "regular" }, { id: 19, state: "regular" }],
            rendir: [{ id: 18, state: "aprobada" }, { id: 19, "state": "aprobada" }]
        }
    },

    // AÑO 4 - CUATRIMESTRE 2
    {
        id: 23, name: "Diseños de experimentos", year: 4, term: 2, link: "", requirements: {
            cursar: [{ id: 18, state: "aprobada" }, { id: 21, state: "regular" }, { id: 22, state: "regular" }, { id: 20, state: "aprobada" }],
            rendir: [{ id: 21, state: "aprobada" }, { id: 22, "state": "aprobada" }]
        }
    },
    {
        id: 24, name: "Series de tiempo", year: 4, term: 2, link: "", requirements: {
            cursar: [{ id: 19, state: "aprobada" }, { id: 21, state: "regular" }, { id: 22, state: "regular" }, { id: 20, state: "aprobada" }],
            rendir: [{ id: 21, state: "aprobada" }, { id: 22, "state": "aprobada" }]
        }
    },
    {
        id: 25, name: "Construcción teórico-metodológica del trabajo final", year: 4, term: 2, link: "", requirements: {
            cursar: [{ id: 18, state: "aprobada" }, { id: 21, state: "regular" }, { id: 22, state: "regular" }, { id: 20, state: "aprobada" }],
            rendir: [{ id: 21, state: "aprobada" }, { id: 22, "state": "aprobada" }]
        }
    },

    { id: 26, name: "Optativa I", year: 4, term: 1, type: 'optativa', link: "", requirements: { cursar: [], rendir: [] } },
    { id: 27, name: "Optativa II", year: 4, term: 2, type: 'optativa', link: "", requirements: { cursar: [], rendir: [] } },

    // AÑO 5
    { id: 28, name: "Optativa III", year: 5, term: 1, type: 'optativa', link: "", requirements: { cursar: [], rendir: [] } },
    { id: 29, name: "Optativa IV", year: 5, term: 1, type: 'optativa', link: "", requirements: { cursar: [], rendir: [] } },

    {
        id: 30, name: "Trabajo Final Integrador", year: 5, term: 1, link: "", requirements: {
            cursar: [
                { id: 1, state: "aprobada" }, { id: 2, state: "aprobada" }, { id: 3, state: "aprobada" },
                { id: 4, state: "aprobada" }, { id: 5, state: "aprobada" }, { id: 6, state: "aprobada" },
                { id: 7, state: "aprobada" }, { id: 8, state: "aprobada" }, { id: 9, state: "aprobada" },
                { id: 10, state: "aprobada" }, { id: 11, state: "aprobada" }, { id: 12, state: "aprobada" },
                { id: 13, state: "aprobada" }, { id: 14, state: "aprobada" }, { id: 15, state: "aprobada" },
                { id: 16, state: "aprobada" }, { id: 17, state: "aprobada" }, { id: 18, state: "aprobada" },
                { id: 19, state: "aprobada" }, { id: 20, state: "aprobada" },
                { id: 21, state: "regular" }, { id: 22, state: "aprobada" }, { id: 23, state: "aprobada" },
                { id: 24, state: "aprobada" }, { id: 25, state: "regular" }
            ],
            rendir: [
                { id: 21, state: "aprobada" }, { id: 25, state: "aprobada" }
            ]
        }
    },
];
