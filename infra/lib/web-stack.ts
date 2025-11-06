import { Stack, StackProps, Duration, CfnOutput, RemovalPolicy } from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { Construct } from 'constructs'; import * as logs from 'aws-cdk-lib/aws-logs';            // <-- add this


export class WebStack extends Stack {
	constructor(scope: Construct, id: string, props?: StackProps) {
		super(scope, id, props);

		// 1) Private bucket for static site
		const siteBucket = new s3.Bucket(this, 'SiteBucket', {
			blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
			encryption: s3.BucketEncryption.S3_MANAGED,
			objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
			removalPolicy: RemovalPolicy.RETAIN,
			autoDeleteObjects: false
		});

		// 2) Lambda (Node 20) for API
		const apiFn = new lambda.Function(this, 'ApiFn', {
			runtime: lambda.Runtime.NODEJS_20_X,
			handler: 'index.handler',
			code: lambda.Code.fromInline(`
    exports.handler = async function (event) {
      const rawPath  = event?.rawPath || '/';
      const method   = event?.requestContext?.http?.method || 'GET';

      if (rawPath.endsWith('/ping') && method === 'GET') {
        return json(200, {
          ok: true,
          method,
          path: rawPath,
          ts: Date.now(),
          region: process.env.AWS_REGION,
          functionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
          memory: Number(process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE || 0)
        });
      }

      if (rawPath.endsWith('/echo') && method === 'POST') {
        let parsed = null;
        try { parsed = event?.body ? JSON.parse(event.body) : null; } catch {}
        return json(200, {
          ok: true,
          method,
          path: rawPath,
          ts: Date.now(),
          region: process.env.AWS_REGION,
          functionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
          memory: Number(process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE || 0),
          echo: parsed
        });
      }

      return json(404, { ok: false, error: 'not found', path: rawPath, method });
    };

    function json(status, obj) {
      return {
        statusCode: status,
        headers: {
          'content-type': 'application/json',
          'access-control-allow-origin': '*',
          'cache-control': 'no-store'
        },
        body: JSON.stringify(obj)
      };
    }
  `),
			memorySize: 128,
			timeout: Duration.seconds(5),
			logRetention: logs.RetentionDays.ONE_DAY
		});


		// 3) HTTP API with Lambda integration
		const api = new apigwv2.HttpApi(this, 'HttpApi', {
			corsPreflight: {
				allowOrigins: ['*'],
				allowMethods: [apigwv2.CorsHttpMethod.ANY],
				allowHeaders: ['*']
			}
		});
		api.addRoutes({
			path: '/api/{proxy+}',
			methods: [apigwv2.HttpMethod.ANY],
			integration: new integrations.HttpLambdaIntegration('ApiInt', apiFn)
		});

		// 4) CloudFront origins: S3 via OAC, and API Gateway
		// S3 origin with modern OAC
		const s3Origin = origins.S3BucketOrigin.withOriginAccessControl(siteBucket);
		// API Gateway default hostname
		const apiOrigin = new origins.HttpOrigin(
			`${api.apiId}.execute-api.${this.region}.amazonaws.com`,
			{ protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY }
		);

		// 5) Distribution: default → S3, /api/* → HTTP API
		const dist = new cloudfront.Distribution(this, 'WebDist', {
			defaultRootObject: 'index.html',
			defaultBehavior: {
				origin: s3Origin,
				viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
				allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
				cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
				responseHeadersPolicy: cloudfront.ResponseHeadersPolicy.SECURITY_HEADERS
			},
			additionalBehaviors: {
				'api/*': {
					origin: apiOrigin,
					viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
					allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
					cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
					originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER
				}
			},
			// SPA-style fallback so deep links load
			errorResponses: [
				{ httpStatus: 403, responseHttpStatus: 200, responsePagePath: '/index.html', ttl: Duration.seconds(0) },
				{ httpStatus: 404, responseHttpStatus: 200, responsePagePath: '/index.html', ttl: Duration.seconds(0) }
			]
		});

		new CfnOutput(this, 'BucketName', { value: siteBucket.bucketName });
		new CfnOutput(this, 'DistributionId', { value: dist.distributionId });
		new CfnOutput(this, 'DistributionDomain', { value: dist.domainName });
		new CfnOutput(this, 'ApiBaseUrl', { value: `https://${api.apiId}.execute-api.${this.region}.amazonaws.com` });
	}
}
