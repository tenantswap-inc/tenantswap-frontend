import { SwapRequest, MatchChain } from "../shared/types";

/**
 * The Chain-Link Algorithm
 * We treat the users as nodes in a directed graph.
 * An edge A -> B exists if B's 'leavingFrom' property matches A's 'lookingFor' criteria.
 */
export const findMatches = (
  currentUser: SwapRequest,
  allRequests: SwapRequest[]
): MatchChain[] => {
  const chains: MatchChain[] = [];
  const maxDepth = 4; // We look for cycles up to 4 people for the MVP

  // Filter out the current user from the candidates list
  const others = allRequests.filter((req) => req.id !== currentUser.id);

  const isMatch = (seeker: SwapRequest, provider: SwapRequest) => {
    return (
      seeker.lookingFor.type === provider.leavingFrom.type &&
      seeker.lookingFor.location === provider.leavingFrom.location
    );
  };

  const visited = new Set<string>();

  const findCycles = (path: SwapRequest[], depth: number) => {
    if (depth > maxDepth) return;

    const lastNode = path[path.length - 1];

    // Check if the current last node can satisfy the FIRST node in the path (closing the cycle)
    if (path.length >= 2 && isMatch(currentUser, lastNode)) {
      chains.push({
        id: `chain-${path.map((p) => p.id).join("-")}`,
        participants: [...path],
        isDirect: path.length === 2,
      });
      // We found a cycle, don't return yet if we want to find nested ones,
      // but usually one path per branch is enough for the user.
    }

    // Try extending the path
    for (const neighbor of others) {
      if (!path.find((p) => p.id === neighbor.id)) {
        // Does this neighbor have what the last person in our path wants?
        if (isMatch(lastNode, neighbor)) {
          findCycles([...path, neighbor], depth + 1);
        }
      }
    }
  };

  // Start the search from the current user
  findCycles([currentUser], 1);

  // De-duplicate and sort: prioritize shorter chains (direct matches)
  return chains
    .filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i)
    .sort((a, b) => a.participants.length - b.participants.length);
};
