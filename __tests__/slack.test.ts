import * as github from '@actions/github';
import nock from 'nock';
import * as fs from 'fs';
import * as path from 'path';
import {Block, Slack} from '../src/slack';
import {commonContext, repoUrl} from './github.test';

describe('Base Field Tests', () => {
  function generateExpectedBaseField(
    actionUrl: string,
    eventBlockText: string
  ): object[] {
    return [
      {
        type: 'mrkdwn',
        text: `*repository*\n<${repoUrl}|${commonContext.owner}/${commonContext.repo}>`
      },
      {
        type: 'mrkdwn',
        text: `*ref*\n${commonContext.ref}`
      },
      {
        type: 'mrkdwn',
        text: `*event name*\n${eventBlockText}`
      },
      {
        type: 'mrkdwn',
        text: `*workflow*\n<${actionUrl}|${commonContext.workflow}>`
      }
    ];
  }

  test('With event link', () => {
    github.context.eventName = 'pull_request';
    const eventUrl = `${repoUrl}/pull/${commonContext.number}`;
    const actionUrl = `${eventUrl}/checks`;
    const expectedBaseField = generateExpectedBaseField(
      actionUrl,
      `<${eventUrl}|${github.context.eventName}>`
    );
    expect(Block.getBaseField()).toEqual(expectedBaseField);
  });

  test('Without event link', () => {
    github.context.eventName = 'push';
    const actionUrl = `${repoUrl}/commit/${commonContext.sha}/checks`;
    const expectedBaseField = generateExpectedBaseField(
      actionUrl,
      github.context.eventName
    );
    expect(Block.getBaseField()).toEqual(expectedBaseField);
  });
});

describe('Commit Field Tests', () => {
  test('Commit field with author', () => {
    const context = {
      url: 'https://this.is.test',
      message: 'this is test',
      author: {
        url: 'https://moia-oss',
        name: 'moia-oss'
      }
    };
    const expectedCommitField = [
      {
        type: 'mrkdwn',
        text: `*commit*\n<${context.url}|${context.message}>`
      },
      {
        type: 'mrkdwn',
        text: `*author*\n<${context.author.url}|${context.author.name}>`
      }
    ];

    expect(Block.getCommitField(context)).toEqual(expectedCommitField);
  });

  test('Commit field without author', () => {
    const context = {
      url: 'https://this.is.test',
      message: 'this is test'
    };
    const expectedCommitField = [
      {
        type: 'mrkdwn',
        text: `*commit*\n<${context.url}|${context.message}>`
      }
    ];
    expect(Block.getCommitField(context)).toEqual(expectedCommitField);
  });
});

describe('Webhook Payload Tests', () => {
  const context = {
    jobName: 'test',
    status: 'success',
    mention: 'bot',
    mentionCondition: 'always',
    commit: {
      message: 'Hello World\nYEAH!!!!!',
      url: 'https://this.is.test',
      author: {
        name: 'moia-oss',
        url: 'https://moia-oss'
      }
    }
  } as const;

  test('Mention needs always', () => {
    expect(Slack.isMention('always', 'test')).toBe(true);
  });

  test('Mention needs when failed', () => {
    expect(Slack.isMention('failure', 'failure')).toBe(true);
  });

  test('No mention because condition and actual status are different', () => {
    expect(Slack.isMention('success', 'failure')).toBe(false);
  });

  test('Generate slack webhook payload', () => {
    github.context.eventName = 'pull_request';
    const eventUrl = `${repoUrl}/pull/${commonContext.number}`;

    const expectedPayload = {
      text: `<!${context.mention}> ${context.jobName} ${
        Block.status[context.status]['result']
      }`,
      attachments: [
        {
          color: Block.status[context.status]['color'],
          blocks: [
            {
              type: 'section',
              fields: [
                {
                  type: 'mrkdwn',
                  text: `*repository*\n<${repoUrl}|${commonContext.owner}/${commonContext.repo}>`
                },
                {
                  type: 'mrkdwn',
                  text: `*ref*\n${commonContext.ref}`
                },
                {
                  type: 'mrkdwn',
                  text: `*event name*\n<${eventUrl}|${github.context.eventName}>`
                },
                {
                  type: 'mrkdwn',
                  text: `*workflow*\n<${eventUrl}/checks|${commonContext.workflow}>`
                },
                {
                  type: 'mrkdwn',
                  text: `*commit*\n<${context.commit.url}|${
                    context.commit.message.split('\n')[0]
                  }>`
                },
                {
                  type: 'mrkdwn',
                  text: `*author*\n<${context.commit.author.url}|${context.commit.author.name}>`
                }
              ]
            }
          ]
        }
      ],
      unfurl_links: true
    };

    expect(
      Slack.generateWebhookPayload(
        context.jobName,
        context.status,
        context.mention,
        context.mentionCondition,
        context.commit
      )
    ).toEqual(expectedPayload);
  });

  test('Generate slack api payload', () => {
    github.context.eventName = 'pull_request';
    const eventUrl = `${repoUrl}/pull/${commonContext.number}`;

    const expectedPayload = {
      text: `<!${context.mention}> ${context.jobName} ${
        Block.status[context.status]['result']
      }`,
      attachments: [
        {
          color: Block.status[context.status]['color'],
          blocks: [
            {
              type: 'section',
              fields: [
                {
                  type: 'mrkdwn',
                  text: `*repository*\n<${repoUrl}|${commonContext.owner}/${commonContext.repo}>`
                },
                {
                  type: 'mrkdwn',
                  text: `*ref*\n${commonContext.ref}`
                },
                {
                  type: 'mrkdwn',
                  text: `*event name*\n<${eventUrl}|${github.context.eventName}>`
                },
                {
                  type: 'mrkdwn',
                  text: `*workflow*\n<${eventUrl}/checks|${commonContext.workflow}>`
                },
                {
                  type: 'mrkdwn',
                  text: `*commit*\n<${context.commit.url}|${
                    context.commit.message.split('\n')[0]
                  }>`
                },
                {
                  type: 'mrkdwn',
                  text: `*author*\n<${context.commit.author.url}|${context.commit.author.name}>`
                }
              ]
            }
          ]
        }
      ],
      unfurl_links: true,
      username: 'username',
      channel: 'channel',
      icon_emoji: 'icon_emoji'
    };

    expect(
      Slack.generateApiPayload(
        'username',
        'channel',
        'icon_emoji',
        context.jobName,
        context.status,
        context.mention,
        context.mentionCondition,
        context.commit
      )
    ).toEqual(expectedPayload);
  });
});

describe('Multiple Webhook Tests', () => {
  const baseUrl = 'https://this.is.test';
  const payload = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'payload.json'), {encoding: 'utf8'})
  );

  test('Post to multiple webhooks successfully', async () => {
    nock(baseUrl).post('/webhook1').reply(200, 'ok');
    nock(baseUrl).post('/webhook2').reply(200, 'ok');
    nock(baseUrl).post('/webhook3').reply(200, 'ok');

    const urls = [
      `${baseUrl}/webhook1`,
      `${baseUrl}/webhook2`,
      `${baseUrl}/webhook3`
    ];

    const res = await Slack.notifyMultipleWebhooks(
      urls,
      'moia-oss',
      'test',
      'pray',
      payload
    );
    expect(res).toBe(undefined);
  });

  test('Single URL works (backward compatibility)', async () => {
    nock(baseUrl).post('/single').reply(200, 'ok');

    const urls = [`${baseUrl}/single`];

    const res = await Slack.notifyMultipleWebhooks(
      urls,
      'moia-oss',
      'test',
      'pray',
      payload
    );
    expect(res).toBe(undefined);
  });

  test('Partial failure - attempts all URLs and reports errors', async () => {
    nock(baseUrl).post('/success1').reply(200, 'ok');
    nock(baseUrl).post('/failure1').reply(404, {error: 'channel_not_found'});
    nock(baseUrl).post('/success2').reply(200, 'ok');

    const urls = [
      `${baseUrl}/success1`,
      `${baseUrl}/failure1`,
      `${baseUrl}/success2`
    ];

    await expect(
      Slack.notifyMultipleWebhooks(urls, 'moia-oss', 'test', 'pray', payload)
    ).rejects.toThrow(
      'Failed to post message to 1 of 3 Slack webhook(s)'
    );
  });

  test('All URLs fail', async () => {
    nock(baseUrl).post('/fail1').reply(500, 'error');
    nock(baseUrl).post('/fail2').reply(500, 'error');

    const urls = [`${baseUrl}/fail1`, `${baseUrl}/fail2`];

    await expect(
      Slack.notifyMultipleWebhooks(urls, 'moia-oss', 'test', 'pray', payload)
    ).rejects.toThrow(
      'Failed to post message to 2 of 2 Slack webhook(s)'
    );
  });
});

describe('Post Message Tests', () => {
  const baseUrl = 'https://this.is.test';
  const payload = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'payload.json'), {encoding: 'utf8'})
  );

  test('Post webhook successfully', async () => {
    nock(baseUrl).post('/success').reply(200, 'ok');

    const res = await Slack.notifyWebhook(
      `${baseUrl}/success`,
      'moia-oss',
      'test',
      'pray',
      payload
    );
    expect(res).toBe(undefined);
  });

  test('Post api successfully', async () => {
    nock('https://slack.com').post('/api/chat.postMessage').reply(200, {
      ok: true
    });

    const res = await Slack.notifyApi(`${baseUrl}/success`, {
      text: 'test',
      channel: 'moia-oss'
    });
    expect(res).toBe(undefined);
  });

  test('Throw error', async () => {
    nock(baseUrl).post('/failure').reply(404, {error: 'channel_not_found'});

    try {
      await Slack.notifyWebhook(
        `${baseUrl}/failure`,
        'moia-oss',
        'test',
        'pray',
        payload
      );
    } catch (err) {
      expect(err).toHaveProperty('message', 'Failed to post message to Slack');
    }
  });
});
