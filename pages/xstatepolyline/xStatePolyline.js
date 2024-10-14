import Konva from "konva";
import { createMachine, interpret } from "xstate";


const stage = new Konva.Stage({
    container: "container",
    width: 400,
    height: 400,
});

const layer = new Konva.Layer();
stage.add(layer);

const MAX_POINTS = 10;
let polyline // La polyline en cours de construction;

const polylineMachine = createMachine(
    {
        /** @xstate-layout N4IgpgJg5mDOIC5QAcD2AbAngGQJYDswA6XCdMAYgFkB5AVQGUBRAYWwEkWBpAbQAYAuohSpYuAC65U+YSAAeiAIwB2AGxFFAZgAcAFgCsu3asX79m5doA0ITIgBMfPkX18AnKuN8D9z-e0AvgE2aFh4hEQQAE4AhgDuBFDU9My0AGpM-EJIIGhiktKyCgj69ooauopuypr2lrp8mpo2dgjOboZ8rsbKRk6K9vpBIRg4BMTR8YnJjKwc3FmyeRJSMjnFA7pEg5p8vqqD5vrWtogAtAZElZrVyop7ysp8esO5o+ETsQn4SbSzbJxeIpsiJ8qsiudtJoiNpSm5dDdVIZVHcTq1SkQng03HVSpoqvZXqExhFJt8kgAhGIAYwA1rBkDSwIscssCmtQMVDMorspSqptDVnt5FC0HLo3DDTCptI0cZZlET3uNIl9plS6QymTxgUtRCtCutEJV1LLtH4Bai3FCxQhNKpnLU3F0mh1YfZdEqwiqydMmPhxGAoizQQaOfJzg6rlpenxTP09rpbfY3NCDA1PIpPHpdITgm9vaS1T8KP7A8Hdaz9eyIQgzvaYQ0ofaEY98UnTghKo7rcZFCpFLD8Yr88SPqqpiWmLBqTFkMzBHqwYbOUpLERVNUdMZdHdN81O-ctrttGVGrKs4pjEF8-hUBA4HrC2Al2Ha2ctOV3fDEcjUbaP1qFxZU8CxtA6TR9GqL0SWIUhyFfGsjQQFMYWeUoJRRO4LFFQ9fBhJ47ncPl8XsTQYPHX0fkQ8FkMg9Rd30FQHRUDwbltAZTUI+5qnMAZyJvIA */
        id: "polyLine",
        initial: "idle",
        states : {
            idle: {
                on: {
                    MOUSECLICK: {
                        target: "drawing",
                        actions: "createLine"
                    }
                }
            },

            drawing: {
                on: {
                    MOUSEMOVE: {
                        target: "drawing",
                        actions: "setLastPoint",
                        internal: true
                    },

                    MOUSECLICK: [{
                        target: "drawing",
                        actions: ["addPoint"],
                        internal: true,
                        cond: "pasPlein"
                    }, "idle"],

                    Backspace: [{
                        target: "drawing",
                        internal: true,
                        actions: "removeLastPoint",
                        cond: "plusDeUnPoint"
                    }, {
                        target: "drawing",
                        internal: true
                    }],

                    Enter: [{
                        target: "idle",
                        cond: "plusDeUnPoint",
                        actions: "saveLine"
                    }, {
                        target: "drawing",
                        internal: true
                    }],

                    Escape: {
                        target: "idle",
                        actions: "abandon"
                    }
                }
            }
        }
    },
    // Quelques actions et guardes que vous pouvez utiliser dans votre machine
    {
        actions: {
            // Créer une nouvelle polyline
            createLine: (context, event) => {
                const pos = stage.getPointerPosition();
                polyline = new Konva.Line({
                    points: [pos.x, pos.y, pos.x, pos.y],
                    stroke: "red",
                    strokeWidth: 2,
                });
                layer.add(polyline);
            },
            // Mettre à jour le dernier point (provisoire) de la polyline
            setLastPoint: (context, event) => {
                const pos = stage.getPointerPosition();
                const currentPoints = polyline.points(); // Get the current points of the line
                const size = currentPoints.length;

                const newPoints = currentPoints.slice(0, size - 2); // Remove the last point
                polyline.points(newPoints.concat([pos.x, pos.y]));
                layer.batchDraw();
            },
            // Enregistrer la polyline
            saveLine: (context, event) => {
                const currentPoints = polyline.points(); // Get the current points of the line
                const size = currentPoints.length;
                // Le dernier point(provisoire) ne fait pas partie de la polyline
                const newPoints = currentPoints.slice(0, size - 2);
                polyline.points(newPoints);
                layer.batchDraw();
            },
            // Ajouter un point à la polyline
            addPoint: (context, event) => {
                const pos = stage.getPointerPosition();
                const currentPoints = polyline.points(); // Get the current points of the line
                const newPoints = [...currentPoints, pos.x, pos.y]; // Add the new point to the array
                polyline.points(newPoints); // Set the updated points to the line
                layer.batchDraw(); // Redraw the layer to reflect the changes
            },
            // Abandonner le tracé de la polyline
            abandon: (context, event) => {
                // Supprimer la variable polyline :
                polyline.remove();
            },
            // Supprimer le dernier point de la polyline
            removeLastPoint: (context, event) => {
                const currentPoints = polyline.points(); // Get the current points of the line
                const size = currentPoints.length;
                const provisoire = currentPoints.slice(size - 2, size); // Le point provisoire
                const oldPoints = currentPoints.slice(0, size - 4); // On enlève le dernier point enregistré
                polyline.points(oldPoints.concat(provisoire)); // Set the updated points to the line
                layer.batchDraw(); // Redraw the layer to reflect the changes
            },
        },
        guards: {
            // On peut encore ajouter un point
            pasPlein: (context, event) => {
                // Retourner vrai si la polyline a moins de 10 points
                // attention : dans le tableau de points, chaque point est représenté par 2 valeurs (coordonnées x et y)
                return true;
            },
            // On peut enlever un point
            plusDeDeuxPoints: (context, event) => {
                // Deux coordonnées pour chaque point, plus le point provisoire
                return polyline.points().length > 6;
            },
            plusDeUnPoint: (context, event) => {
                // Deux coordonnées pour chaque point, plus le point provisoire
                return polyline.points().length > 4;
            }
        },
    }
);

// On démarre la machine
const polylineService = interpret(polylineMachine)
    .onTransition((state) => {
        console.log("Current state:", state.value);
    })
    .start();
// On envoie les événements à la machine
stage.on("click", () => {
    polylineService.send("MOUSECLICK");
});

stage.on("mousemove", () => {
    polylineService.send("MOUSEMOVE");
});

// Envoi des touches clavier à la machine
window.addEventListener("keydown", (event) => {
    console.log("Key pressed:", event.key);
    // Enverra "a", "b", "c", "Escape", "Backspace", "Enter"... à la machine
    polylineService.send(event.key);
});
