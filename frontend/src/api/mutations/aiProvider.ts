import { gql } from '@apollo/client';
import { AI_PROVIDER_BASE_FRAGMENT } from '../fragments';

export const CREATE_AI_PROVIDER_MUTATION = gql`
  mutation CreateAiProvider($input: CreateAiProviderInput!) {
    createAiProvider(input: $input) {
      success
      message
      error { code message }
      data { ...AiProviderBase }
    }
  }
  ${AI_PROVIDER_BASE_FRAGMENT}
`;

export const UPDATE_AI_PROVIDER_MUTATION = gql`
  mutation UpdateAiProvider($providerId: String!, $input: UpdateAiProviderInput!) {
    updateAiProvider(providerId: $providerId, input: $input) {
      success
      message
      error { code message }
      data { ...AiProviderBase }
    }
  }
  ${AI_PROVIDER_BASE_FRAGMENT}
`;

export const DELETE_AI_PROVIDER_MUTATION = gql`
  mutation DeleteAiProvider($providerId: String!) {
    deleteAiProvider(providerId: $providerId) {
      success
      message
      error { code message }
    }
  }
`;

export const TEST_AI_CONNECTION_MUTATION = gql`
  mutation TestAiConnection($providerId: String!) {
    testAiConnection(providerId: $providerId) {
      success
      message
      error { code message }
    }
  }
`;

export const GENERATE_TEST_CASES_MUTATION = gql`
  mutation GenerateTestCases($input: GenerateTestCasesInput!) {
    generateTestCases(input: $input) {
      success
      message
      error { code message }
      content
      model
      usage
    }
  }
`;
