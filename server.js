const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

const posts = [
  {
    id: 'post-1',
    title: 'Welcome',
    content: 'This is your first post created with a validated REST API.',
    category: 'General',
    createdAt: '2026-07-24T10:00:00.000Z'
  }
];

const schedules = [
  {
    id: 'schedule-1',
    title: 'Project Review',
    scheduledDate: '2026-07-25',
    notes: 'Discuss milestones and next steps.',
    createdAt: '2026-07-24T10:00:00.000Z'
  }
];

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(morgan('dev'));

app.use((req, res, next) => {
  const correlationId = req.get('x-correlation-id') || uuidv4();
  req.correlationId = correlationId;
  res.setHeader('x-correlation-id', correlationId);
  next();
});

const buildSuccess = (res, data, message = 'Success', status = 200) => {
  return res.status(status).json({ success: true, message, data });
};

const buildError = (res, status, message, errors = null) => {
  return res.status(status).json({ success: false, message, errors });
};

const validatePostPayload = (payload) => {
  const errors = [];

  if (typeof payload.title !== 'string' || !payload.title.trim()) {
    errors.push('Title is required.');
  } else if (payload.title.trim().length < 3) {
    errors.push('Title must be at least 3 characters long.');
  }

  if (typeof payload.content !== 'string' || !payload.content.trim()) {
    errors.push('Content is required.');
  } else if (payload.content.trim().length < 10) {
    errors.push('Content must be at least 10 characters long.');
  }

  if (payload.category && typeof payload.category !== 'string') {
    errors.push('Category must be a string.');
  }

  return errors;
};

const validateSchedulePayload = (payload) => {
  const errors = [];

  if (typeof payload.title !== 'string' || !payload.title.trim()) {
    errors.push('Title is required.');
  } else if (payload.title.trim().length < 3) {
    errors.push('Title must be at least 3 characters long.');
  }

  if (typeof payload.scheduledDate !== 'string' || !payload.scheduledDate.trim()) {
    errors.push('scheduledDate is required.');
  } else {
    const parsedDate = new Date(payload.scheduledDate);
    if (Number.isNaN(parsedDate.getTime())) {
      errors.push('scheduledDate must be a valid date.');
    }
  }

  if (payload.notes && typeof payload.notes !== 'string') {
    errors.push('Notes must be a string.');
  }

  return errors;
};

const findById = (items, id) => items.find((item) => item.id === id);

app.get('/api/health', (req, res) => {
  buildSuccess(res, { status: 'ok' }, 'API is healthy');
});

app.get('/api/posts', (req, res) => {
  buildSuccess(res, posts, 'Posts fetched successfully');
});

app.post('/api/posts', (req, res, next) => {
  try {
    const errors = validatePostPayload(req.body || {});
    if (errors.length) {
      return buildError(res, 400, 'Validation failed', errors);
    }

    const post = {
      id: `post-${Date.now()}`,
      title: req.body.title.trim(),
      content: req.body.content.trim(),
      category: req.body.category?.trim() || 'General',
      createdAt: new Date().toISOString()
    };

    posts.unshift(post);
    buildSuccess(res, post, 'Post created successfully', 201);
  } catch (error) {
    next(error);
  }
});

app.get('/api/posts/:id', (req, res) => {
  const post = findById(posts, req.params.id);
  if (!post) {
    return buildError(res, 404, 'Post not found');
  }

  buildSuccess(res, post, 'Post fetched successfully');
});

app.put('/api/posts/:id', (req, res, next) => {
  try {
    const post = findById(posts, req.params.id);
    if (!post) {
      return buildError(res, 404, 'Post not found');
    }

    const errors = validatePostPayload(req.body || {});
    if (errors.length) {
      return buildError(res, 400, 'Validation failed', errors);
    }

    Object.assign(post, {
      title: req.body.title.trim(),
      content: req.body.content.trim(),
      category: req.body.category?.trim() || post.category,
      updatedAt: new Date().toISOString()
    });

    buildSuccess(res, post, 'Post updated successfully');
  } catch (error) {
    next(error);
  }
});

app.delete('/api/posts/:id', (req, res) => {
  const index = posts.findIndex((post) => post.id === req.params.id);
  if (index === -1) {
    return buildError(res, 404, 'Post not found');
  }

  posts.splice(index, 1);
  buildSuccess(res, { deletedId: req.params.id }, 'Post deleted successfully');
});

app.get('/api/schedules', (req, res) => {
  buildSuccess(res, schedules, 'Schedules fetched successfully');
});

app.post('/api/schedules', (req, res, next) => {
  try {
    const errors = validateSchedulePayload(req.body || {});
    if (errors.length) {
      return buildError(res, 400, 'Validation failed', errors);
    }

    const schedule = {
      id: `schedule-${Date.now()}`,
      title: req.body.title.trim(),
      scheduledDate: req.body.scheduledDate.trim(),
      notes: req.body.notes?.trim() || '',
      createdAt: new Date().toISOString()
    };

    schedules.push(schedule);
    buildSuccess(res, schedule, 'Schedule created successfully', 201);
  } catch (error) {
    next(error);
  }
});

app.get('/api/schedules/:id', (req, res) => {
  const schedule = findById(schedules, req.params.id);
  if (!schedule) {
    return buildError(res, 404, 'Schedule not found');
  }

  buildSuccess(res, schedule, 'Schedule fetched successfully');
});

app.put('/api/schedules/:id', (req, res, next) => {
  try {
    const schedule = findById(schedules, req.params.id);
    if (!schedule) {
      return buildError(res, 404, 'Schedule not found');
    }

    const errors = validateSchedulePayload(req.body || {});
    if (errors.length) {
      return buildError(res, 400, 'Validation failed', errors);
    }

    Object.assign(schedule, {
      title: req.body.title.trim(),
      scheduledDate: req.body.scheduledDate.trim(),
      notes: req.body.notes?.trim() || schedule.notes,
      updatedAt: new Date().toISOString()
    });

    buildSuccess(res, schedule, 'Schedule updated successfully');
  } catch (error) {
    next(error);
  }
});

app.delete('/api/schedules/:id', (req, res) => {
  const index = schedules.findIndex((schedule) => schedule.id === req.params.id);
  if (index === -1) {
    return buildError(res, 404, 'Schedule not found');
  }

  schedules.splice(index, 1);
  buildSuccess(res, { deletedId: req.params.id }, 'Schedule deleted successfully');
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((req, res) => {
  buildError(res, 404, 'Route not found');
});

app.use((err, req, res, next) => {
  console.error(`[${req.correlationId}] ${err.stack || err.message}`);
  buildError(res, err.statusCode || 500, err.message || 'Internal server error');
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
