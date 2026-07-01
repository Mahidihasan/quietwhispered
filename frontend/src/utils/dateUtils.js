export const toValidDate = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const resolved = typeof value?.toDate === 'function' ? value.toDate() : value;
  const date = resolved instanceof Date ? resolved : new Date(resolved);

  if (!(date instanceof Date) || Number.isNaN(date.getTime()) || date.getTime() === 0) {
    return null;
  }

  return date;
};

export const resolvePostDate = (post) => {
  if (!post) return null;
  return (
    toValidDate(post.date) ||
    toValidDate(post.createdAt) ||
    toValidDate(post.updatedAt) ||
    null
  );
};
