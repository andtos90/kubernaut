import multer from 'multer';
import Boom from 'boom';
import hogan from 'hogan.js';
import { safeLoadAll as yaml2json, } from 'js-yaml';

const storage = multer.memoryStorage();
const upload = multer({ storage: storage, });

export default function(options = {}) {

  function start({ pkg, app, store, checksum, auth, }, cb) {

    app.use('/api/releases', auth('api'));

    app.get('/api/releases', async (req, res, next) => {
      try {
        if (!req.user.hasPermission('placeholder', 'releases-read')) return next(Boom.forbidden());

        const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
        const offset = req.query.offset ? parseInt(req.query.offset, 10) : undefined;
        const releases = await store.listReleases(limit, offset);
        res.json(releases);
      } catch (err) {
        next(err);
      }
    });

    app.get('/api/releases/:id', async (req, res, next) => {
      try {
        if (!req.user.hasPermission('placeholder', 'releases-read')) return next(Boom.forbidden());

        const release = await store.getRelease(req.params.id);
        return release ? res.json(release) : next();
      } catch (err) {
        next(err);
      }
    });

    app.post('/api/releases', upload.single('template'), async (req, res, next) => {

      try {
        if (!req.user.hasPermission('placeholder', 'releases-write')) return next(Boom.forbidden());

        if (!req.body.service) return next(Boom.badRequest('service is required'));
        if (!req.body.version) return next(Boom.badRequest('version is required'));

        const data = {
          service: {
            name: req.body.service,
          },
          version: req.body.version,
          template: await getTemplate(req.file.buffer, res.locals.logger),
          attributes: req.body,
        };
        const meta = { date: new Date(), account: req.user.id, };
        const release = await store.saveRelease(data, meta);
        res.json({ id: release.id, });
      } catch (err) {
        next(err);
      }
    });

    app.delete('/api/releases/:id', async (req, res, next) => {
      try {
        if (!req.user.hasPermission('placeholder', 'releases-read')) return next(Boom.forbidden());

        const meta = { date: new Date(), account: req.user.id, };
        await store.deleteRelease(req.params.id, meta);
        res.status(204).send();
      } catch (err) {
        next(err);
      }
    });

    function getTemplate(buffer, logger) {
      return new Promise(resolve => {
        const yaml = buffer.toString();
        hogan.compile(yaml).render({});
        const json = yaml2json(yaml);
        resolve({ source: { yaml, json, }, checksum: checksum(buffer), });
      }).catch(err => {
        logger.error(err);
        throw Boom.badRequest('Error in template');
      });
    }

    cb();
  }

  return {
    start,
  };
}
