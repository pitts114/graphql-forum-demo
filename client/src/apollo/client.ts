import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client'

const httpLink = createHttpLink({
  uri: 'http://localhost:4567/graphql',
  credentials: 'include', // Important: send cookies with requests for session auth
})

export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache({
    typePolicies: {
      ThreadType: {
        fields: {
          comments: {
            merge(_, incoming) {
              return incoming
            },
          },
        },
      },
      CommentType: {
        fields: {
          likes: {
            merge(_, incoming) {
              return incoming
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
})