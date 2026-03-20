Connect / Unlock Contact button on match detail

Call:
POST /matching/interests/:targetListingId/request
Path param:
targetListingId = match.targetListing.id
Body:
{
  "requesterListingId": "<my-listing-id>"
}
Use requesterListingId when the user has multiple listings; otherwise backend falls back to latest active one
After request is sent

Show success state like:
Request sent
Awaiting owner approval
Response contains:
data.interest.id
data.interest.status
data.interest.expiresAt
Owner Incoming Requests screen

Call:
GET /matching/interests/incoming
Use for listing owner dashboard
Screen can show:
which listing is receiving requests
how many open requests it has
requester info
request status
Actions per request:
POST /matching/interests/:interestId/approve
POST /matching/interests/:interestId/decline
Requester Sent Requests screen

Call:
GET /matching/interests/outgoing
Use to show:
pending requests
approved requests
declined requests
confirmed requests
Important:
only show owner phone when status is:
CONTACT_APPROVED
or CONFIRMED_RENTER
Contact visibility rule

Before approval:
requester should not see owner phone
After approval:
requester may see and use owner phone from outgoing request payload
Finalization

If owner wants to mark one requester as the actual renter:
POST /matching/interests/:interestId/confirm-renter
If requester confirms after approval:
POST /matching/interests/:interestId/confirm-taken
Backend then:
confirms selected request
releases others
reruns matching for released users
sends notifications
Recommended screen structure

Dashboard

call GET /users/me
render listings + matches
Match detail

use selected match
show Connect
Sent requests

call GET /matching/interests/outgoing
Owner requests inbox

call GET /matching/interests/incoming