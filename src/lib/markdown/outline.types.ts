export type OutlineItem = {
  id: string;
  level: number;
  text: string;
};

export type OutlineTreeNode = OutlineItem & {
  children: OutlineTreeNode[];
};
