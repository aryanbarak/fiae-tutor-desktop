import { MouseEvent, useMemo, useRef } from "react";
import dagre from "dagre";
import ReactFlow, {
  Background,
  Controls,
  Edge,
  Handle,
  MarkerType,
  MiniMap,
  Node,
  NodeProps,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";
import { TopicId } from "../../../domain/topicRegistry";

type GraphEdgeInput = {
  fromPatternId: string;
  toAlgorithmId: TopicId;
};

type PatternAlgorithmGraphProps = {
  focusedPatternId: string | null;
  patternItems: { id: string; label: string }[];
  algorithmIds: TopicId[];
  edges: GraphEdgeInput[];
  onPatternSelect: (patternId: string) => void;
  onAlgorithmSelect: (topicId: TopicId) => void;
  onResetFocus: () => void;
};

type GraphNodeData =
  | { kind: "pattern"; machineId: string; label: string }
  | { kind: "algorithm"; machineId: string; label: string };

const NODE_WIDTH = 230;
const NODE_HEIGHT = 46;

function GraphNodeView({ data }: NodeProps<GraphNodeData>) {
  const sourcePosition = data.kind === "pattern" ? Position.Right : Position.Left;
  const targetPosition = data.kind === "pattern" ? Position.Left : Position.Right;
  return (
    <>
      <Handle type="target" position={targetPosition} style={styles.hiddenHandle} />
      <span>{data.label}</span>
      <Handle type="source" position={sourcePosition} style={styles.hiddenHandle} />
    </>
  );
}

function nodeKey(kind: "pattern" | "algorithm", id: string): string {
  return `${kind}:${id}`;
}

function createNode(kind: "pattern" | "algorithm", machineId: string, label: string): Node<GraphNodeData> {
  return {
    id: nodeKey(kind, machineId),
    type: "graphNode",
    data: { kind, machineId, label },
    position: { x: 0, y: 0 },
    style:
      kind === "pattern"
        ? {
            width: NODE_WIDTH,
            height: NODE_HEIGHT,
            borderRadius: 8,
            border: "1px solid #84d6a5",
            background: "#1f4d34",
            color: "#d8ffe5",
            fontSize: 13,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }
        : {
            width: NODE_WIDTH,
            height: NODE_HEIGHT,
            borderRadius: 8,
            border: "1px solid #5f8dbe",
            background: "#1f2f44",
            color: "#d9ecff",
            fontSize: 13,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          },
  };
}

function layoutGraph(nodes: Node<GraphNodeData>[], edges: Edge[]): Node<GraphNodeData>[] {
  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({
    rankdir: "LR",
    ranksep: 230,
    nodesep: 42,
    marginx: 24,
    marginy: 24,
  });

  for (const node of nodes) {
    graph.setNode(node.id, {
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      rank: node.data.kind === "pattern" ? "min" : "max",
    });
  }

  for (const edge of edges) {
    graph.setEdge(edge.source, edge.target);
  }

  dagre.layout(graph);

  return nodes.map((node) => {
    const position = graph.node(node.id);
    return {
      ...node,
      position: {
        x: position.x - NODE_WIDTH / 2,
        y: position.y - NODE_HEIGHT / 2,
      },
    };
  });
}

export function PatternAlgorithmGraph({
  focusedPatternId,
  patternItems,
  algorithmIds,
  edges,
  onPatternSelect,
  onAlgorithmSelect,
  onResetFocus,
}: PatternAlgorithmGraphProps) {
  const didFitViewRef = useRef(false);
  const nodeTypes = useMemo(() => ({ graphNode: GraphNodeView }), []);
  const focusedSourceId = focusedPatternId ? nodeKey("pattern", focusedPatternId) : null;

  const focusedAlgorithmIds = useMemo(() => {
    if (!focusedPatternId) return new Set<string>();
    const related = edges
      .filter((edge) => edge.fromPatternId === focusedPatternId)
      .map((edge) => nodeKey("algorithm", edge.toAlgorithmId));
    return new Set(related);
  }, [edges, focusedPatternId]);

  const visibleEdgesInput = useMemo(() => {
    if (!focusedPatternId) return edges;
    return edges.filter((edge) => edge.fromPatternId === focusedPatternId);
  }, [edges, focusedPatternId]);

  const graphEdges: Edge[] = useMemo(
    () =>
      visibleEdgesInput.map((edge) => ({
        id: `edge:${edge.fromPatternId}->${edge.toAlgorithmId}`,
        source: nodeKey("pattern", edge.fromPatternId),
        target: nodeKey("algorithm", edge.toAlgorithmId),
        type: "smoothstep",
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
        style: {
          stroke: "#5f8dbe",
          strokeWidth: 2,
        },
      })),
    [visibleEdgesInput]
  );

  const nodes: Node<GraphNodeData>[] = useMemo(() => {
    const patternNodes = patternItems.map((pattern) => createNode("pattern", pattern.id, pattern.label));
    const algorithmNodes = algorithmIds.map((algorithmId) => createNode("algorithm", algorithmId, algorithmId));

    return layoutGraph([...patternNodes, ...algorithmNodes], graphEdges).map((node) => {
      if (!focusedPatternId) {
        return node;
      }

      if (node.data.kind === "pattern" && node.id === focusedSourceId) {
        return {
          ...node,
          style: {
            ...node.style,
            border: "1px solid #d8ffe5",
            boxShadow: "0 0 0 3px rgba(132, 214, 165, 0.35)",
          },
        };
      }

      if (node.data.kind === "algorithm" && focusedAlgorithmIds.has(node.id)) {
        return {
          ...node,
          style: {
            ...node.style,
            border: "1px solid #d9ecff",
            boxShadow: "0 0 0 3px rgba(95, 141, 190, 0.3)",
          },
        };
      }

      return {
        ...node,
        style: {
          ...node.style,
          opacity: 0.2,
        },
      };
    });
  }, [algorithmIds, focusedAlgorithmIds, focusedPatternId, focusedSourceId, graphEdges, patternItems]);

  const onNodeClick = (_: MouseEvent, node: Node<GraphNodeData>) => {
    if (node.data.kind === "pattern") {
      onPatternSelect(node.data.machineId);
      return;
    }
    onAlgorithmSelect(node.data.machineId as TopicId);
  };

  return (
    <div style={styles.container}>
      <button type="button" style={styles.resetButton} onClick={onResetFocus}>
        Reset Focus
      </button>
      <ReactFlow
        nodes={nodes}
        edges={graphEdges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        onInit={(instance) => {
          if (didFitViewRef.current) return;
          didFitViewRef.current = true;
          requestAnimationFrame(() => {
            instance.fitView({ padding: 0.18 });
          });
        }}
        onlyRenderVisibleElements
        panOnDrag
        zoomOnScroll
        zoomOnPinch
        zoomOnDoubleClick
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
      >
        <MiniMap
          pannable
          zoomable
          nodeColor={(node) => (node.data.kind === "pattern" ? "#2f7550" : "#2f4668")}
          maskColor="rgba(8, 12, 18, 0.7)"
        />
        <Controls />
        <Background color="#1f2a3a" gap={20} size={1} />
      </ReactFlow>
      {visibleEdgesInput.length === 0 && <div style={styles.noLinks}>No links found</div>}
    </div>
  );
}

const styles = {
  container: {
    position: "relative" as const,
    marginTop: "0.75rem",
    border: "1px solid #2b3744",
    borderRadius: "8px",
    background: "#0f131a",
    height: "560px",
    width: "100%",
    overflow: "hidden" as const,
  },
  noLinks: {
    position: "absolute" as const,
    bottom: "16px",
    left: "16px",
    color: "#f0c988",
    fontSize: "12px",
    pointerEvents: "none" as const,
  },
  resetButton: {
    position: "absolute" as const,
    top: "12px",
    right: "12px",
    zIndex: 5,
    border: "1px solid #446280",
    background: "#162231",
    color: "#d9ecff",
    borderRadius: "6px",
    padding: "0.35rem 0.6rem",
    fontSize: "12px",
    cursor: "pointer" as const,
  },
  hiddenHandle: {
    width: 1,
    height: 1,
    opacity: 0,
    border: "none",
    background: "transparent",
  },
};
