SELECT
  r.id,
  r.version,
  r.template,
  r.created_on,
  r.created_by,
  s.id AS service_id,
  s.name AS service_name,
  rt.id as template_id,
  rt.source_yaml as template_source_yaml,
  rt.source_json as template_source_json,
  rt.checksum as template_checksum
FROM
  active_release__vw r, release_template rt, service s
WHERE
  s.name = $1 AND
  r.version = $2 AND
  r.service = s.id AND
  r.template = rt.id
;
