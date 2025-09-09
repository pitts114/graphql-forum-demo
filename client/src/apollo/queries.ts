import { gql } from '@apollo/client'

export const GET_THREADS = gql`
  query GetThreads {
    threads {
      id
      title
      content
      createdAt
      commentCount
      user {
        id
        username
      }
    }
  }
`

export const GET_THREAD = gql`
  query GetThread($id: ID!) {
    thread(id: $id) {
      id
      title
      content
      createdAt
      user {
        id
        username
      }
      comments {
        id
        content
        createdAt
        likesCount
        isLikedByCurrentUser
        user {
          id
          username
        }
      }
    }
  }
`

export const CREATE_THREAD = gql`
  mutation CreateThread($title: String!, $content: String!) {
    createThread(title: $title, content: $content) {
      id
      title
      content
      createdAt
      user {
        id
        username
      }
    }
  }
`

export const CREATE_COMMENT = gql`
  mutation CreateComment($threadId: ID!, $content: String!) {
    createComment(threadId: $threadId, content: $content) {
      id
      content
      createdAt
      likesCount
      isLikedByCurrentUser
      user {
        id
        username
      }
    }
  }
`

export const TOGGLE_LIKE = gql`
  mutation ToggleLike($commentId: ID!) {
    toggleLike(commentId: $commentId)
  }
`