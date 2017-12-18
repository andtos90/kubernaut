SELECT
  d.id,
  d.context,
  d.created_on,
  d.created_by,
  s.id AS service_id,
  s.name AS service_name,
  r.id AS release_id,
  r.version AS release_version
FROM
  active_deployment__vw d,
  service s,
  release r
WHERE
  d.release = r.id AND
  r.service = s.id
ORDER BY
  d.created_on DESC,
  d.id DESC
LIMIT
  $1
OFFSET
  $2
;
