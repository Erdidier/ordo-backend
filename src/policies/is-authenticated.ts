module.exports = (policyContext) => {
  if (policyContext.state.user) {
    return true;
  }

  return false;
};
