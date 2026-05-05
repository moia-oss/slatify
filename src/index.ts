import * as core from '@actions/core';
import * as github from './github';
import {validateStatus, isValidCondition, parseUrls} from './utils';
import {Slack} from './slack';

async function run() {
  const status = validateStatus(
    core.getInput('type', {required: true}).toLowerCase()
  );
  const jobName = core.getInput('job_name', {required: true});
  const url = process.env.SLACK_WEBHOOK || core.getInput('url');
  const urlsInput = core.getInput('urls');
  const webhookUrls = urlsInput ? parseUrls(urlsInput) : [];
  if (webhookUrls.length > 0 && url) {
    core.warning('"urls" takes precedence over "url"');
  } else if (url) {
    webhookUrls.push(url);
  }
  const slackBotToken =
    process.env.SLACK_BOT_TOKEN || core.getInput('slack_bot_token');
  let mention = core.getInput('mention');
  let mentionCondition = core.getInput('mention_if').toLowerCase();
  let username = core.getInput('username');
  let channel = core.getInput('channel');
  let icon_emoji = core.getInput('icon_emoji');
  const commitFlag = core.getInput('commit') === 'true';
  const token = core.getInput('token');

  if (mention && !isValidCondition(mentionCondition)) {
    mention = '';
    mentionCondition = '';
    core.warning(`Ignore slack message metion:
      mention_if: ${mentionCondition} is invalid
      `);
  }

  if (webhookUrls.length === 0 && !slackBotToken) {
    throw new Error(`Missing Slack Incoming Webhooks URL or Slack Bot Token.
      To use incoming webhooks please configure "SLACK_WEBHOOK" as an environment variable or
      specify the "url" or "urls" key.

      To use web api please configure "SLACK_BOT_TOKEN" as an environment variable or
      specify the "slack_bot_token" key.
      `);
  }

  let commit: github.CommitContext | undefined;
  if (commitFlag) {
    commit = await github.getCommit(token);
  }

  if (webhookUrls.length > 0) {
    const payload = Slack.generateWebhookPayload(
      jobName,
      status,
      mention,
      mentionCondition,
      commit
    );
    core.debug(`Generated payload for slack webhook(s): ${JSON.stringify(payload)}`);

    await Slack.notifyMultipleWebhooks(webhookUrls, username, channel, icon_emoji, payload);
    core.info(`Posted message to ${webhookUrls.length} Slack webhook(s)`);
  } else if (slackBotToken) {
    const payload = Slack.generateApiPayload(
      username,
      channel,
      icon_emoji,
      jobName,
      status,
      mention,
      mentionCondition,
      commit
    );
    core.debug(`Generated payload for slack api: ${JSON.stringify(payload)}`);

    await Slack.notifyApi(slackBotToken, payload);
    core.info('Post message to Slack Web API');
  }
}

run().catch(err => {
  core.setFailed(err);
});
