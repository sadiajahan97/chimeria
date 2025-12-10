export const getInitials = (name: string) => {
  if (!name) return "";

  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "";

  if (parts.length === 1) return parts[0][0].toUpperCase();

  const firstName = parts[0];
  const lastName = parts[parts.length - 1];

  return (firstName[0] + lastName[0]).toUpperCase();
};

export const calculateBoundingBoxArea = (
  boundingBox: [number, number, number, number]
) => {
  const [x1, y1, x2, y2] = boundingBox;
  return Math.abs((x2 - x1) * (y2 - y1));
};
