import { App } from 'aws-cdk-lib';
import { WebStack } from '../lib/web-stack';

const app = new App();
new WebStack(app, 'WebStack', {
	env: {
		account: process.env.CDK_DEFAULT_ACCOUNT ?? '<YOUR_ACCOUNT_ID>',
		region: process.env.CDK_DEFAULT_REGION ?? 'ca-central-1'
	}
});
