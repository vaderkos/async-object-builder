import { Builder } from './async-object-builder'

interface Server {}
interface Config {}
interface Service {}
interface Logger {}
interface Repository {}

interface CommonOptions {
    config: Config
    logger: Logger
}

// pretty-logger.ts
class PrettyLogger implements Logger {
    constructor(public config: Config) {}
}

// json-logger.ts
class JsonLogger implements Logger {
    constructor(public config: Config) {}
}

// email-service.ts
class EmailService implements Service {
    static create (options: CommonOptions): Promise<EmailService> { return {} as Promise<EmailService> }
}

// user-repository.ts
class UserRepository implements Repository {
    static create (options: CommonOptions): Promise<UserRepository> { return {} as Promise<UserRepository> }
}

// user-service.ts
interface UserServiceOptions extends CommonOptions {
    repositories: {
        userRepository: UserRepository
    }
}

class UserService implements Service {
    static create (options: UserServiceOptions): UserService {
        return {} as UserService
    }
}

declare const builder: Builder<{}, {}>

// somewhere where app is created
const appPromise = builder
    .props(['server', 'logger', 'config'])
    .records(['services', 'repositories'])
    .guardProp<'server', Server>()
    .guardRecord<'services', Service>()
    .guard<{
        logger: Logger,
        config: Config,
        repositories: Record<string, Repository>
    }>()
    .supplyConfig(() => ({} as Config))
    .supplyLogger(async ({ config }) => process.env.NODE_ENV === 'local'
        ? new PrettyLogger(config)
        : new JsonLogger(config)
    )
    .supplyServer(Promise.resolve({} as Server))
    .supplyToRepositories({
        userRepository: UserRepository.create
    })
    .supplyToRepositories({
        dupaRepository: ({ repositories }) => {
            return {} as Repository
        }
    })
    .supplyToServices({
        userService: UserService.create,
        emailService: EmailService.create
    })
    .build()